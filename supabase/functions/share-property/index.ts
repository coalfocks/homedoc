import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';

type ShareRequest = {
  propertyId?: string;
  recipientEmail?: string;
  role?: 'admin' | 'member';
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError(405, 'Use POST to share a property');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError(401, 'Missing authorization header');
    }

    const body = (await req.json()) as ShareRequest;
    const propertyId = body.propertyId?.trim();
    const recipientEmail = normalizeEmail(body.recipientEmail);
    const role = body.role === 'member' ? 'member' : 'admin';

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

    const { data: property, error: propertyError } = await userClient
      .from('properties')
      .select('id, name, household_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return jsonError(404, 'Property not found');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    let householdId = property.household_id as string | null;

    if (!householdId) {
      const { data: household, error: householdError } = await adminClient
        .from('households')
        .insert({
          name: `${property.name} household`,
          created_by: currentUser.id,
        })
        .select('id')
        .single();

      if (householdError || !household) {
        return jsonError(500, 'Failed to create household');
      }

      householdId = household.id;

      const { error: updatePropertyError } = await adminClient
        .from('properties')
        .update({ household_id: householdId })
        .eq('id', property.id);

      if (updatePropertyError) {
        return jsonError(500, 'Failed to prepare property sharing');
      }

      await adminClient.from('household_members').upsert({
        household_id: householdId,
        user_id: currentUser.id,
        role: 'owner',
        invited_by: currentUser.id,
      });
    }

    const { data: callerMember } = await adminClient
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
      return jsonError(
        403,
        'Only household owners and admins can share this property',
      );
    }

    const recipient = await findUserByEmail(adminClient, recipientEmail);
    if (!recipient) {
      return jsonError(
        404,
        'No HomeDoc account exists for that email yet. Ask them to sign up first.',
      );
    }

    if (recipient.id === currentUser.id) {
      return jsonError(400, 'You already have access to this property');
    }

    const { data: member, error: memberError } = await adminClient
      .from('household_members')
      .upsert(
        {
          household_id: householdId,
          user_id: recipient.id,
          role,
          invited_by: currentUser.id,
        },
        { onConflict: 'household_id,user_id' },
      )
      .select('role')
      .single();

    if (memberError) {
      return jsonError(500, memberError.message);
    }

    return jsonResponse({
      propertyId: property.id,
      propertyName: property.name,
      recipientEmail: recipient.email,
      role: member.role,
    });
  } catch (err) {
    console.error('share-property error:', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase() || '';
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
    const match = users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
}
