import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';
import { saveAppStoreAccess } from '../_shared/app-store.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');
  const url = Deno.env.get('SUPABASE_URL')!;
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer '))
    return jsonError(401, 'Sign in first.');
  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return jsonError(401, 'Sign in first.');
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    // The authenticated user, never a submitted user ID or entitlement flag.
    await saveAppStoreAccess(admin, data.user.id);
    return jsonResponse({ synced: true });
  } catch {
    return jsonError(
      503,
      'Could not verify your purchase. Please try restoring purchases again.',
    );
  }
});
