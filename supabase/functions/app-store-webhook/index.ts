import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse } from '../_shared/cors.ts';
import { isUserId, saveAppStoreAccess } from '../_shared/app-store.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_AUTHORIZATION');
  if (!secret) return jsonError(503, 'Webhook is not configured.');
  if (req.headers.get('Authorization') !== secret)
    return jsonError(401, 'Unauthorized');
  try {
    const { event } = await req.json();
    if (!event || typeof event !== 'object')
      return jsonError(400, 'Missing event');
    if (event.type === 'TEST') return jsonResponse({ received: true });
    const ids = new Set<unknown>([
      event.app_user_id,
      ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
      ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
    ]);
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    for (const id of ids) {
      if (!isUserId(id)) continue;
      // Account deletion is terminal; don't recreate data for deleted users.
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error?.status === 404) continue;
      if (error || !data.user) throw new Error('Account lookup failed');
      await saveAppStoreAccess(admin, id);
    }
    return jsonResponse({ received: true });
  } catch {
    // Non-2xx asks RevenueCat to retry. Do not log purchase or account data.
    return jsonError(503, 'Subscription sync failed. Retry this event.');
  }
});
