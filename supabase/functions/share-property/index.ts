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
      .select('id, name')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return jsonError(404, 'Property not found');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: canShare, error: canShareError } = await userClient.rpc(
      'current_user_can_manage_property',
      { p_property_id: property.id },
    );

    if (canShareError || !canShare) {
      return jsonError(
        403,
        'Only property owners and admins can share this property',
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

    const { data: collaborator, error: collaboratorError } = await adminClient
      .from('property_collaborators')
      .upsert(
        {
          property_id: property.id,
          user_id: recipient.id,
          role,
          status: 'active',
          invited_by: currentUser.id,
        },
        { onConflict: 'property_id,user_id' },
      )
      .select('role, status')
      .single();

    if (collaboratorError) {
      return jsonError(500, collaboratorError.message);
    }

    return jsonResponse({
      propertyId: property.id,
      propertyName: property.name,
      recipientEmail: recipient.email,
      role: collaborator.role,
      status: collaborator.status,
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
