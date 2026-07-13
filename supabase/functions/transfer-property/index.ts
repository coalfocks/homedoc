import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TransferRequest = {
  propertyId?: string;
  recipientEmail?: string;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError(405, 'Use POST to transfer a property');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError(401, 'Missing authorization header');
    }

    const body = (await req.json()) as TransferRequest;
    const propertyId = body.propertyId?.trim();
    const recipientEmail = normalizeEmail(body.recipientEmail);

    if (!propertyId || !recipientEmail) {
      return jsonError(400, 'Property and recipient email are required');
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: currentUserData, error: currentUserError } =
      await userClient.auth.getUser();
    const currentUser = currentUserData?.user;

    if (currentUserError || !currentUser) {
      return jsonError(401, 'Invalid authentication');
    }

    // RLS verifies the caller currently owns the property.
    const { data: property, error: propertyError } = await userClient
      .from('properties')
      .select('id, name, user_id, household_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return jsonError(404, 'Property not found');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const recipient = await findUserByEmail(adminClient, recipientEmail);

    if (!recipient) {
      return jsonError(
        404,
        'No HomeDoc account exists for that email yet. Ask them to sign up first.',
      );
    }

    if (recipient.id === currentUser.id) {
      return jsonError(400, "You can't transfer a property to yourself");
    }

    const { data: canManageCurrentHousehold } = property.household_id
      ? await adminClient
          .from('household_members')
          .select('role')
          .eq('household_id', property.household_id)
          .eq('user_id', currentUser.id)
          .maybeSingle()
      : { data: null };

    if (
      property.user_id !== currentUser.id &&
      !['owner', 'admin'].includes(canManageCurrentHousehold?.role)
    ) {
      return jsonError(
        403,
        'Only household owners and admins can transfer this property',
      );
    }

    const recipientHouseholdId = await getOrCreatePrimaryHousehold(
      adminClient,
      recipient.id,
    );

    const { error: updateError } = await adminClient
      .from('properties')
      .update({
        user_id: recipient.id,
        household_id: recipientHouseholdId,
      })
      .eq('id', property.id);

    if (updateError) {
      return jsonError(500, 'Failed to transfer property');
    }

    return jsonResponse({
      propertyId,
      propertyName: property.name,
      recipientEmail: recipient.email,
      householdId: recipientHouseholdId,
    });
  } catch (err) {
    console.error('transfer-property error:', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase() || '';
}

async function getOrCreatePrimaryHousehold(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: existing, error: existingError } = await adminClient
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.household_id) return existing.household_id as string;

  const { data: household, error: householdError } = await adminClient
    .from('households')
    .insert({ name: 'My household', created_by: userId })
    .select('id')
    .single();

  if (householdError || !household) {
    throw householdError || new Error('Failed to create recipient household');
  }

  const { error: memberError } = await adminClient
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: userId,
      role: 'owner',
      invited_by: userId,
    });

  if (memberError) throw memberError;
  return household.id as string;
}

async function findUserByEmail(
  adminClient: ReturnType<typeof createClient>,
  email: string,
) {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data?.users ?? [];
    const match = users.find((user) => normalizeEmail(user.email) === email);
    if (match) return match;

    if (users.length < perPage) return null;
    page += 1;
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(status: number, message: string) {
  return jsonResponse({ error: message }, status);
}
