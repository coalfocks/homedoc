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

  try {
    const imagePathsToDelete = new Set<string>();

    const { data: properties, error: propertyError } = await adminClient
      .from('properties')
      .select('id, household_id, image_url')
      .eq('user_id', userId);

    if (propertyError) {
      return jsonError(500, propertyError.message);
    }

    for (const property of properties ?? []) {
      const replacementOwnerId = await findReplacementOwner(
        adminClient,
        property.id,
        property.household_id,
        userId,
      );

      if (replacementOwnerId) {
        const replacementHouseholdId = await createHandoffHousehold(
          adminClient,
          replacementOwnerId,
          property.id,
        );
        const { error: transferError } = await adminClient
          .from('properties')
          .update({
            user_id: replacementOwnerId,
            household_id: replacementHouseholdId,
          })
          .eq('id', property.id);

        if (transferError) {
          return jsonError(500, transferError.message);
        }

        continue;
      }

      addImagePath(imagePathsToDelete, property.image_url);

      const { data: areas, error: areaError } = await adminClient
        .from('areas')
        .select('id, image_url')
        .eq('property_id', property.id);

      if (areaError) {
        return jsonError(500, areaError.message);
      }

      const areaIds = (areas ?? []).map((area) => area.id);
      for (const area of areas ?? []) {
        addImagePath(imagePathsToDelete, area.image_url);
      }

      if (areaIds.length > 0) {
        const { data: notes, error: notesError } = await adminClient
          .from('notes')
          .select('images')
          .in('area_id', areaIds);

        if (notesError) {
          return jsonError(500, notesError.message);
        }

        for (const note of notes ?? []) {
          for (const image of note.images ?? []) {
            addImagePath(imagePathsToDelete, image);
          }
        }

        const { error: notesDeleteError } = await adminClient
          .from('notes')
          .delete()
          .in('area_id', areaIds);
        if (notesDeleteError) return jsonError(500, notesDeleteError.message);

        const { error: todosDeleteError } = await adminClient
          .from('todos')
          .delete()
          .in('area_id', areaIds);
        if (todosDeleteError) return jsonError(500, todosDeleteError.message);

        const { error: contractorDeleteError } = await adminClient
          .from('contractor_area_access')
          .delete()
          .in('area_id', areaIds);
        if (contractorDeleteError) {
          return jsonError(500, contractorDeleteError.message);
        }

        const { error: areasDeleteError } = await adminClient
          .from('areas')
          .delete()
          .in('id', areaIds);
        if (areasDeleteError) return jsonError(500, areasDeleteError.message);
      }

      const { error: collaboratorsDeleteError } = await adminClient
        .from('property_collaborators')
        .delete()
        .eq('property_id', property.id);
      if (collaboratorsDeleteError) {
        return jsonError(500, collaboratorsDeleteError.message);
      }

      const { error: propertyDeleteError } = await adminClient
        .from('properties')
        .delete()
        .eq('id', property.id);
      if (propertyDeleteError) {
        return jsonError(500, propertyDeleteError.message);
      }
    }

    if (imagePathsToDelete.size > 0) {
      const { error: storageDeleteError } = await adminClient.storage
        .from('images')
        .remove([...imagePathsToDelete]);

      if (storageDeleteError) {
        return jsonError(500, storageDeleteError.message);
      }
    }

    const { error: collaboratorMembershipError } = await adminClient
      .from('property_collaborators')
      .delete()
      .eq('user_id', userId);
    if (collaboratorMembershipError) {
      return jsonError(500, collaboratorMembershipError.message);
    }

    const { error: householdDeleteError } = await adminClient
      .from('household_members')
      .delete()
      .eq('user_id', userId);
    if (householdDeleteError) {
      return jsonError(500, householdDeleteError.message);
    }

    const { error: entitlementDeleteError } = await adminClient
      .from('user_entitlements')
      .delete()
      .eq('user_id', userId);
    if (entitlementDeleteError) {
      return jsonError(500, entitlementDeleteError.message);
    }

    const { error: usageDeleteError } = await adminClient
      .from('user_usage')
      .delete()
      .eq('user_id', userId);
    if (usageDeleteError) return jsonError(500, usageDeleteError.message);

    const { error: contractorAccessDeleteError } = await adminClient
      .from('contractor_area_access')
      .delete()
      .or(`owner_user_id.eq.${userId},contractor_user_id.eq.${userId}`);
    if (contractorAccessDeleteError) {
      return jsonError(500, contractorAccessDeleteError.message);
    }

    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return jsonError(500, deleteUserError.message);
    }

    return jsonResponse({ deleted: true });
  } catch (err) {
    console.error('delete-account error:', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});

async function findReplacementOwner(
  adminClient: ReturnType<typeof createClient>,
  propertyId: string,
  householdId: string | null,
  deletedUserId: string,
) {
  const { data: collaborator, error: collaboratorError } = await adminClient
    .from('property_collaborators')
    .select('user_id')
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .neq('user_id', deletedUserId)
    .limit(1)
    .maybeSingle();

  if (collaboratorError) throw collaboratorError;
  if (collaborator?.user_id) return collaborator.user_id as string;

  if (!householdId) return null;

  const { data: householdMember, error: householdMemberError } =
    await adminClient
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)
      .neq('user_id', deletedUserId)
      .order('created_at')
      .limit(1)
      .maybeSingle();

  if (householdMemberError) throw householdMemberError;
  return (householdMember?.user_id as string | undefined) ?? null;
}

function addImagePath(paths: Set<string>, value: string | null | undefined) {
  if (!value || /^(https?:|file:|content:|data:|blob:)/i.test(value)) return;
  paths.add(value);
}

async function createHandoffHousehold(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  propertyId: string,
) {
  const { data: household, error: householdError } = await adminClient
    .from('households')
    .insert({ name: `Property ${propertyId} handoff`, created_by: userId })
    .select('id')
    .single();

  if (householdError || !household) {
    throw householdError || new Error('Failed to create replacement household');
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
