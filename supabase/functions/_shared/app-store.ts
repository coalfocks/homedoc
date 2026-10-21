// RevenueCat is queried server-to-server. Never grant access from SDK payloads
// or webhook event fields, which may be stale or supplied by a client.
export const monthlyProductId = 'com.coalfocks.homedoc.pro.monthly';

type Subscription = {
  store?: string;
  is_sandbox?: boolean;
  refunded_at?: string | null;
  unsubscribe_detected_at?: string | null;
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
};

type Subscriber = {
  entitlements?: Record<
    string,
    {
      product_identifier?: string;
      expires_date?: string | null;
    }
  >;
  subscriptions?: Record<string, Subscription>;
};

export function verifiedAccess(
  subscriber: Subscriber | undefined,
  productId: string,
  allowSandbox: boolean,
  now = Date.now(),
) {
  const entitlement = subscriber?.entitlements?.pro;
  const subscription = subscriber?.subscriptions?.[productId];
  const expiration = Math.max(
    Date.parse(entitlement?.expires_date ?? '') || 0,
    Date.parse(subscription?.expires_date ?? '') || 0,
    Date.parse(subscription?.grace_period_expires_date ?? '') || 0,
  );
  const environment = subscription?.is_sandbox ? 'sandbox' : 'production';
  const active =
    entitlement?.product_identifier === productId &&
    subscription?.store === 'app_store' &&
    typeof subscription.is_sandbox === 'boolean' &&
    !subscription.refunded_at &&
    (environment === 'production' || allowSandbox) &&
    expiration > now;

  return {
    status: active ? 'active' : 'expired',
    productId,
    expiresAt: expiration > 0 ? new Date(expiration).toISOString() : null,
    environment,
  };
}

export function isUserId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function loadAppStoreAccess(userId: string) {
  const secret = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!secret) throw new Error('App Store verification is not configured.');
  const observedAt = new Date().toISOString();
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10000),
    },
  );
  // A provider outage must not erase a paid entitlement or manufacture access.
  if (!response.ok) {
    throw new Error('Could not verify the App Store subscription. Try again.');
  }
  const body = await response.json();
  if (!body.subscriber || typeof body.subscriber !== 'object') {
    throw new Error(
      'Subscription verification returned an incomplete response.',
    );
  }
  return {
    ...verifiedAccess(
      body.subscriber,
      Deno.env.get('APP_STORE_PRO_PRODUCT_ID') || monthlyProductId,
      Deno.env.get('APP_STORE_ALLOW_SANDBOX') === 'true' &&
        (Deno.env.get('APP_STORE_SANDBOX_USER_IDS') || '')
          .split(',')
          .map((id) => id.trim())
          .includes(userId),
    ),
    observedAt,
  };
}

export async function saveAppStoreAccess(
  admin: {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ error: unknown }>;
  },
  userId: string,
) {
  const access = await loadAppStoreAccess(userId);
  const { error } = await admin.rpc('save_app_store_entitlement', {
    p_user_id: userId,
    p_status: access.status,
    p_product_id: access.productId,
    p_expires_at: access.expiresAt,
    p_environment: access.environment,
    p_observed_at: access.observedAt,
  });
  if (error)
    throw new Error('Could not save the verified subscription. Try again.');
  return access;
}
