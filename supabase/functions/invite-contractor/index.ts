import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';

type InviteRequest = {
  areaId: string;
  contractorEmail: string;
  contractorName?: string;
  companyName?: string;
  trade?: string;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonError(401, 'Missing authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const body = (await req.json()) as InviteRequest;
  const contractorEmail = body.contractorEmail?.trim().toLowerCase();

  if (!body.areaId || !contractorEmail) {
    return jsonError(400, 'areaId and contractorEmail are required');
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonError(401, 'Invalid authentication');
  }

  const { data: area, error: areaError } = await userClient
    .from('areas')
    .select('id, name, properties!inner(id, name)')
    .eq('id', body.areaId)
    .single();

  const property = area?.properties as { id: string; name: string } | undefined;

  const { data: canManageArea, error: accessError } = await userClient.rpc(
    'current_user_can_manage_area',
    { p_area_id: body.areaId },
  );

  if (areaError || accessError || !area || !canManageArea) {
    return jsonError(404, 'Area not found for this account');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const contractor = await findUserByEmail(adminClient, contractorEmail);

  if (!contractor) {
    return jsonError(
      404,
      'No HomeDoc account exists for that contractor email yet. Ask them to create an account first.',
    );
  }

  if (contractor.id === userData.user.id) {
    return jsonError(400, 'You cannot invite yourself as a contractor');
  }

  const { data: profile } = await adminClient
    .from('contractor_profiles')
    .select('display_name, company_name, trade, verification_status')
    .eq('user_id', contractor.id)
    .maybeSingle();

  const contractorName =
    body.contractorName?.trim() ||
    profile?.display_name ||
    contractor.email ||
    contractorEmail;

  const { data: access, error: accessError } = await adminClient
    .from('contractor_area_access')
    .upsert(
      {
        area_id: body.areaId,
        owner_user_id: userData.user.id,
        contractor_user_id: contractor.id,
        contractor_email: contractorEmail,
        contractor_name: contractorName,
        company_name: body.companyName?.trim() || profile?.company_name || null,
        trade: body.trade?.trim() || profile?.trade || null,
        verification_status: profile?.verification_status || 'unverified',
        status: 'active',
        revoked_at: null,
      },
      { onConflict: 'area_id,contractor_user_id' },
    )
    .select()
    .single();

  if (accessError) {
    return jsonError(500, accessError.message);
  }

  return jsonResponse({
    access,
    areaName: area.name,
    propertyName: property?.name,
  });
});

async function findUserByEmail(
  adminClient: ReturnType<typeof createClient>,
  email: string,
) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}
