import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';
import { corsHeaders, jsonError, jsonResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const priceId = Deno.env.get('STRIPE_PRO_PRICE_ID');
  const successUrl =
    Deno.env.get('STRIPE_SUCCESS_URL') || 'homedoc://billing/success';
  const cancelUrl =
    Deno.env.get('STRIPE_CANCEL_URL') || 'homedoc://billing/cancel';

  if (!stripeSecretKey || !priceId) {
    return jsonError(
      503,
      'Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID.',
    );
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

  if (userError || !userData.user?.email) {
    return jsonError(401, 'Invalid authentication');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const user = userData.user;
  const { data: entitlement } = await adminClient
    .from('user_entitlements')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId = entitlement?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await adminClient.from('user_entitlements').upsert({
      user_id: user.id,
      plan: 'free',
      status: 'free',
      stripe_customer_id: customerId,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return jsonResponse({ url: session.url });
});
