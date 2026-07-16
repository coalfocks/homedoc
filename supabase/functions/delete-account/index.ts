import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';

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

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return jsonError(401, 'Invalid authentication');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const userId = userData.user.id;

  const { data: properties, error: propertyError } = await adminClient
    .from('properties')
    .select('id')
    .eq('user_id', userId);

  if (propertyError) {
    return jsonError(500, propertyError.message);
  }

  const propertyIds = (properties ?? []).map((property) => property.id);

  if (propertyIds.length > 0) {
    const { data: areas, error: areaError } = await adminClient
      .from('areas')
      .select('id')
      .in('property_id', propertyIds);

    if (areaError) {
      return jsonError(500, areaError.message);
    }

    const areaIds = (areas ?? []).map((area) => area.id);

    if (areaIds.length > 0) {
      await adminClient.from('notes').delete().in('area_id', areaIds);
      await adminClient.from('todos').delete().in('area_id', areaIds);
      await adminClient
        .from('contractor_area_access')
        .delete()
        .in('area_id', areaIds);
      await adminClient.from('areas').delete().in('id', areaIds);
    }

    await adminClient.from('properties').delete().in('id', propertyIds);
  }

  await adminClient.from('household_members').delete().eq('user_id', userId);
  await adminClient.from('user_entitlements').delete().eq('user_id', userId);
  await adminClient.from('user_usage').delete().eq('user_id', userId);
  await adminClient
    .from('contractor_area_access')
    .delete()
    .or(`owner_user_id.eq.${userId},contractor_user_id.eq.${userId}`);

  const { error: deleteUserError } =
    await adminClient.auth.admin.deleteUser(userId);

  if (deleteUserError) {
    return jsonError(500, deleteUserError.message);
  }

  return jsonResponse({ deleted: true });
});
