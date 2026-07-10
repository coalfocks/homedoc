# Stripe Billing Setup

HomeDoc billing is wired through Supabase Edge Functions and a small
`user_entitlements` table.

## Required Stripe Values

Set these Supabase function secrets before checkout can charge real money:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_PRO_PRICE_ID=price_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional redirect overrides:

```bash
npx supabase secrets set STRIPE_SUCCESS_URL=homedoc://billing/success
npx supabase secrets set STRIPE_CANCEL_URL=homedoc://billing/cancel
npx supabase secrets set STRIPE_PORTAL_RETURN_URL=homedoc://billing
```

## Webhook

Create a Stripe webhook endpoint pointing to:

```text
https://nismvycjiobjbaozjwih.supabase.co/functions/v1/stripe-webhook
```

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Entitlement Model

The app reads `public.user_entitlements`.

- Free users have no row or `plan = free`.
- Pro users have `plan = pro` and Stripe status `active` or `trialing`.
- Stripe webhooks are the source of truth for paid state.

## Current Product Gates

- Free: one property and basic records.
- Pro: AI planning and additional properties.
- Transfer remains open for now because it is the GTM/share loop.
