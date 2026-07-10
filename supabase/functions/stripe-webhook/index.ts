import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';
import { jsonError, jsonResponse } from '../_shared/cors.ts';

const activeStatuses = new Set(['active', 'trialing']);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey || !webhookSecret) {
    return jsonError(503, 'Stripe webhook is not configured yet.');
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return jsonError(400, 'Missing Stripe signature');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    return jsonError(
      400,
      error instanceof Error ? error.message : 'Invalid webhook signature',
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await syncSubscription(
      adminClient,
      event.data.object as Stripe.Subscription,
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (typeof session.subscription === 'string') {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription,
      );
      await syncSubscription(adminClient, subscription, session);
    }
  }

  return jsonResponse({ received: true });
});

async function syncSubscription(
  adminClient: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
  session?: Stripe.Checkout.Session,
) {
  const userId =
    subscription.metadata?.supabase_user_id ||
    session?.metadata?.supabase_user_id ||
    session?.client_reference_id;

  if (!userId || typeof subscription.customer !== 'string') {
    return;
  }

  const item = subscription.items.data[0];
  const isPro = activeStatuses.has(subscription.status);

  await adminClient.from('user_entitlements').upsert({
    user_id: userId,
    plan: isPro ? 'pro' : 'free',
    status: subscription.status,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    stripe_price_id: item?.price?.id ?? null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}
