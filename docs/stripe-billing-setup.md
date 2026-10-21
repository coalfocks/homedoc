# Stripe web billing setup

The iOS app uses Apple StoreKit 2 purchases. Stripe checkout is web-only.

Create two active, fixed-price USD recurring Prices for the same HomeDoc Pro benefits:

| Setting                      | Price    | Recurrence              |
| ---------------------------- | -------- | ----------------------- |
| `STRIPE_PRO_PRICE_ID`        | US$2.99  | month, interval_count 1 |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | US$14.99 | year, interval_count 1  |

Set those IDs plus `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` securely as HomeDoc Supabase function secrets. Do not commit keys. Legacy `STRIPE_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` are accepted as fallbacks, but prefer the explicit Pro names.

`create-checkout-session` accepts `{ "interval": "annual" }` or `{ "interval": "monthly" }`. A body-less request or omitted interval defaults monthly for older clients; malformed JSON, primitive/array bodies, and unknown intervals fail. The server verifies price activity, USD currency, exact amount, and recurrence before creating a customer or checkout session. Client-supplied amounts or price IDs cannot select what is charged.

Optional redirect settings are `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, and `STRIPE_PORTAL_RETURN_URL`. Set appropriate HTTPS return URLs for the web deployment. Current defaults are `homedoc://billing/success`, `homedoc://billing/cancel`, and `homedoc://billing`, so confirm web return behavior before enabling sales.

Stripe webhook URL:

`https://nismvycjiobjbaozjwih.supabase.co/functions/v1/stripe-webhook`

Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Verify signatures and monthly/annual lifecycle events in the intended mode before enabling live checkout.

The client reads `get_billing_access`, which resolves Apple, Stripe, beta, or free access. Stripe webhook state is stored separately in `user_entitlements`; canonical Apple state uses `app_store_entitlements`. Active/trialing Stripe Pro has the same 50 monthly AI requests and additional-home entitlement as Apple Pro. Basic records remain free and accessible after expiry. Existing beta users retain their preserved allowance.

See [App Store billing setup](app-store/billing-setup.md) for deployment and native verification requirements. No live Stripe prices or secrets were configured in this source-preparation step.
