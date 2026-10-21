import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';
import {
  isAppleTransactionId,
  saveAppStoreAccess,
} from '../_shared/app-store.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer '))
    return jsonError(401, 'Sign in first.');
  const url = Deno.env.get('SUPABASE_URL')!;
  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return jsonError(401, 'Sign in first.');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid purchase verification request.');
  }
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !isAppleTransactionId((body as { transactionId?: unknown }).transactionId)
  ) {
    return jsonError(400, 'An Apple transaction ID is required.');
  }
  const transactionId = (body as { transactionId: string }).transactionId;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    // The authenticated user and Apple's signed appAccountToken must agree.
    await saveAppStoreAccess(admin, data.user.id, transactionId);
    return jsonResponse({ synced: true });
  } catch {
    return jsonError(
      503,
      'Could not verify your purchase. Please try restoring purchases again.',
    );
  }
});
