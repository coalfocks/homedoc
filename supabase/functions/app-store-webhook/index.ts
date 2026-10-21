import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonError, jsonResponse } from '../_shared/cors.ts';
import {
  isAppleTransactionId,
  isUserId,
  sandboxAllowedForUser,
  saveAppStoreAccess,
  verifiedNotification,
} from '../_shared/app-store.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid App Store notification.');
  }
  const signedPayload =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as { signedPayload?: unknown }).signedPayload
      : undefined;
  if (
    typeof signedPayload !== 'string' ||
    signedPayload.length === 0 ||
    signedPayload.length > 128 * 1024
  ) {
    return jsonError(400, 'Missing signed App Store notification.');
  }

  try {
    const verified = await verifiedNotification(signedPayload);
    const transaction = verified.transaction;
    // Notifications without transaction data (including TEST) need no sync.
    if (!transaction) return jsonResponse({ received: true });
    const userId = transaction.appAccountToken;
    const transactionId = transaction.transactionId;
    if (!isUserId(userId) || !isAppleTransactionId(transactionId)) {
      return jsonResponse({ received: true });
    }
    if (verified.environment === 'Sandbox' && !sandboxAllowedForUser(userId)) {
      return jsonResponse({ received: true });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Account deletion is terminal; never recreate data from an old notice.
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error?.status === 404) return jsonResponse({ received: true });
    if (error || !data.user) throw new Error('Account lookup failed');

    // The notification only identifies a candidate account. Re-query Apple for
    // current subscription state so delayed/replayed events cannot roll access
    // back to an older transaction.
    await saveAppStoreAccess(admin, userId, transactionId);
    return jsonResponse({ received: true });
  } catch (error) {
    // A non-2xx response asks Apple to retry. Never log signed user data.
    const cause =
      error instanceof Error
        ? (error as Error & { cause?: unknown }).cause
        : undefined;
    const missingMethod =
      cause instanceof Error
        ? cause.message.match(
            /crypto\.X509Certificate(?:\.prototype)?\.\w+/,
          )?.[0]
        : undefined;
    console.error('App Store notification verification failed', {
      missingCertificateMethod: missingMethod ?? null,
      verificationStatus:
        error && typeof error === 'object' && 'status' in error
          ? Number(error.status)
          : null,
    });
    return jsonError(503, 'Subscription sync failed. Retry this notification.');
  }
});
