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
  const returnUrl =
    Deno.env.get('STRIPE_PORTAL_RETURN_URL') || 'homedoc://billing';

  if (!stripeSecretKey) {
    return jsonError(503, 'Stripe is not configured yet.');
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
  const { data: entitlement } = await adminClient
    .from('user_entitlements')
    .select('stripe_customer_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (!entitlement?.stripe_customer_id) {
    return jsonError(404, 'No billing account exists yet.');
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: entitlement.stripe_customer_id,
    return_url: returnUrl,
  });

  return jsonResponse({ url: portalSession.url });
});
