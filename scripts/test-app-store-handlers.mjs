import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const uuid = (value) =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);
const validTransactionId = '123456789012345678';
async function load(
  name,
  {
    signedIn = true,
    deleted = false,
    syncFails = false,
    sandboxAllowed = false,
  } = {},
) {
  let handler;
  const synced = [];
  const signedNotifications = new Map();
  const admin = {
    auth: {
      admin: {
        getUserById: async (id) =>
          deleted
            ? { data: {}, error: { status: 404 } }
            : { data: { user: { id } }, error: null },
      },
    },
  };
  const dependencies = {
    'https://deno.land/std@0.224.0/http/server.ts': {
      serve: (fn) => (handler = fn),
    },
    'https://esm.sh/@supabase/supabase-js@2': {
      createClient: (_url, _key, options) =>
        options?.global
          ? {
              auth: {
                getUser: async () =>
                  signedIn
                    ? { data: { user: { id: userA } }, error: null }
                    : { data: {}, error: {} },
              },
            }
          : admin,
    },
    '../_shared/cors.ts': {
      corsHeaders: {},
      jsonResponse: (body, status = 200) =>
        new Response(JSON.stringify(body), { status }),
      jsonError: (status, error) =>
        new Response(JSON.stringify({ error }), { status }),
    },
    '../_shared/app-store.ts': {
      isAppleTransactionId: (value) =>
        typeof value === 'string' && value.length <= 30 && /^\d+$/.test(value),
      isUserId: uuid,
      sandboxAllowedForUser: () => sandboxAllowed,
      verifiedNotification: async (signedPayload) => {
        const notification = signedNotifications.get(signedPayload);
        if (!notification) throw new Error('Invalid signed payload');
        return notification;
      },
      saveAppStoreAccess: async (_admin, id, transactionId) => {
        if (syncFails) throw new Error('offline');
        synced.push({ id, transactionId });
      },
    },
  };
  const source = await readFile(
    new URL(`../supabase/functions/${name}/index.ts`, import.meta.url),
    'utf8',
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports: {},
      Request,
      Response,
      Set,
      Error,
      Deno: {
        env: {
          get: () => 'offline-value',
        },
      },
      require: (path) => {
        assert.ok(path in dependencies, path);
        return dependencies[path];
      },
    },
  );
  return { handler, synced, signedNotifications };
}
const request = (authorization, body = {}, method = 'POST') =>
  new Request('https://offline.invalid', {
    method,
    headers: authorization
      ? { Authorization: authorization, 'Content-Type': 'application/json' }
      : {},
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
let runtime = await load('sync-app-store-entitlement');
assert.equal((await runtime.handler(request(null))).status, 401);
assert.equal(
  (await runtime.handler(request('Bearer fake', {}, 'GET'))).status,
  405,
);
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { userId: userB, isPro: true }),
    )
  ).status,
  400,
  'Client-supplied identity and paid flags are not a valid purchase proof',
);
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { transactionId: 'not-an-apple-id' }),
    )
  ).status,
  400,
);
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { transactionId: '1'.repeat(31) }),
    )
  ).status,
  400,
  'Overlong transaction IDs are rejected before contacting Apple',
);
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { transactionId: validTransactionId }),
    )
  ).status,
  200,
);
assert.deepEqual(runtime.synced, [
  { id: userA, transactionId: validTransactionId },
]);
runtime = await load('sync-app-store-entitlement', { signedIn: false });
assert.equal((await runtime.handler(request('Bearer invalid'))).status, 401);
assert.deepEqual(runtime.synced, []);
runtime = await load('sync-app-store-entitlement', { syncFails: true });
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { transactionId: validTransactionId }),
    )
  ).status,
  503,
);

runtime = await load('app-store-webhook');
assert.equal(
  (
    await runtime.handler(
      request(null, { signedPayload: 'x'.repeat(128 * 1024 + 1) }),
    )
  ).status,
  400,
  'Oversized Apple signed payloads are rejected before verification',
);
assert.equal(
  (await runtime.handler(request(null, { event: { app_user_id: userA } })))
    .status,
  400,
);
assert.deepEqual(runtime.synced, []);
const testPayload = 'apple-signed-test';
runtime.signedNotifications.set(testPayload, {
  payload: { notificationType: 'TEST' },
  environment: 'Production',
  transaction: null,
});
assert.equal(
  (await runtime.handler(request(null, { signedPayload: testPayload }))).status,
  200,
);
assert.deepEqual(runtime.synced, []);
assert.equal(
  (
    await runtime.handler(
      request(null, { signedPayload: 'forged.payload.signature' }),
    )
  ).status,
  503,
  'Unverified Apple notification payloads are rejected',
);
const appleNotification = 'apple-signed-notification';
runtime.signedNotifications.set(appleNotification, {
  payload: { notificationType: 'DID_RENEW' },
  environment: 'Production',
  transaction: {
    appAccountToken: userA,
    transactionId: validTransactionId,
  },
});
assert.equal(
  (await runtime.handler(request(null, { signedPayload: appleNotification })))
    .status,
  200,
);
assert.deepEqual(runtime.synced, [
  { id: userA, transactionId: validTransactionId },
]);
runtime = await load('app-store-webhook', { sandboxAllowed: false });
runtime.signedNotifications.set('sandbox-notification', {
  payload: { notificationType: 'DID_RENEW' },
  environment: 'Sandbox',
  transaction: { appAccountToken: userA, transactionId: validTransactionId },
});
assert.equal(
  (
    await runtime.handler(
      request(null, { signedPayload: 'sandbox-notification' }),
    )
  ).status,
  200,
);
assert.deepEqual(
  runtime.synced,
  [],
  'Unallowlisted sandbox notices are ignored',
);
runtime = await load('app-store-webhook', { deleted: true });
runtime.signedNotifications.set(appleNotification, {
  payload: { notificationType: 'DID_RENEW' },
  environment: 'Production',
  transaction: {
    appAccountToken: userA,
    transactionId: validTransactionId,
  },
});
assert.equal(
  (await runtime.handler(request(null, { signedPayload: appleNotification })))
    .status,
  200,
);
assert.deepEqual(runtime.synced, [], 'Deleted accounts are never recreated');
runtime = await load('app-store-webhook', { syncFails: true });
runtime.signedNotifications.set(appleNotification, {
  payload: { notificationType: 'DID_RENEW' },
  environment: 'Production',
  transaction: {
    appAccountToken: userA,
    transactionId: validTransactionId,
  },
});
assert.equal(
  (await runtime.handler(request(null, { signedPayload: appleNotification })))
    .status,
  503,
);
console.log(
  'Apple App Store handlers passed: authenticated transaction ID sync, verified notification routing, sandbox filtering, deleted accounts, and retry failures.',
);

async function loadCheckout({
  annualInterval = 'year',
  annualAmount = 1499,
} = {}) {
  let handler;
  const createdSessions = [];
  const lookedUpPrices = [];
  const userClient = {
    auth: {
      getUser: async () => ({
        data: { user: { id: userA, email: 'test@example.invalid' } },
        error: null,
      }),
    },
  };
  const adminClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { stripe_customer_id: 'cus_test' },
            error: null,
          }),
        }),
      }),
    }),
  };
  class StripeStub {
    static createFetchHttpClient() {
      return {};
    }
    constructor() {
      this.prices = {
        retrieve: async (id) => {
          lookedUpPrices.push(id);
          return {
            active: true,
            currency: 'usd',
            unit_amount: id === 'price_annual' ? annualAmount : 299,
            recurring: {
              interval: id === 'price_annual' ? annualInterval : 'month',
              interval_count: 1,
            },
          };
        },
      };
      this.checkout = {
        sessions: {
          create: async (params) => {
            createdSessions.push(params);
            return { url: 'https://checkout.example.invalid/session' };
          },
        },
      };
    }
  }
  const dependencies = {
    'https://deno.land/std@0.224.0/http/server.ts': {
      serve: (fn) => (handler = fn),
    },
    'https://esm.sh/@supabase/supabase-js@2': {
      createClient: (_url, _key, options) =>
        options?.global ? userClient : adminClient,
    },
    'https://esm.sh/stripe@16.2.0?target=deno': { default: StripeStub },
    '../_shared/cors.ts': {
      corsHeaders: {},
      jsonResponse: (body, status = 200) =>
        new Response(JSON.stringify(body), { status }),
      jsonError: (status, error) =>
        new Response(JSON.stringify({ error }), { status }),
    },
  };
  const source = await readFile(
    new URL(
      '../supabase/functions/create-checkout-session/index.ts',
      import.meta.url,
    ),
    'utf8',
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports: {},
      Request,
      Response,
      Error,
      Deno: {
        env: {
          get: (key) =>
            ({
              STRIPE_SECRET_KEY: 'sk_test',
              STRIPE_PRO_PRICE_ID: 'price_monthly',
              STRIPE_PRO_ANNUAL_PRICE_ID: 'price_annual',
              SUPABASE_URL: 'https://supabase.example.invalid',
              SUPABASE_ANON_KEY: 'anon',
              SUPABASE_SERVICE_ROLE_KEY: 'service',
            })[key],
        },
      },
      require: (path) => {
        assert.ok(path in dependencies, path);
        return dependencies[path];
      },
    },
  );
  return { handler, createdSessions, lookedUpPrices };
}

const checkoutRequest = (interval) =>
  new Request('https://example.invalid/checkout', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(interval === undefined ? {} : { interval }),
  });
const checkoutRawRequest = (body) =>
  new Request('https://example.invalid/checkout', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid',
      'Content-Type': 'application/json',
    },
    body,
  });
let checkout = await loadCheckout();
assert.equal((await checkout.handler(checkoutRequest('monthly'))).status, 200);
assert.equal(checkout.lookedUpPrices.at(-1), 'price_monthly');
assert.equal(
  checkout.createdSessions.at(-1).line_items[0].price,
  'price_monthly',
);
assert.equal((await checkout.handler(checkoutRequest('annual'))).status, 200);
assert.equal(checkout.lookedUpPrices.at(-1), 'price_annual');
assert.equal(
  checkout.createdSessions.at(-1).line_items[0].price,
  'price_annual',
);
assert.equal((await checkout.handler(checkoutRequest(undefined))).status, 200);
assert.equal(
  checkout.createdSessions.at(-1).line_items[0].price,
  'price_monthly',
);
assert.equal(
  (
    await checkout.handler(
      new Request('https://example.invalid/checkout', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid' },
      }),
    )
  ).status,
  200,
  'A truly empty legacy POST body defaults to monthly checkout',
);
assert.equal(
  checkout.createdSessions.at(-1).line_items[0].price,
  'price_monthly',
);
const sessionsBeforeInvalid = checkout.createdSessions.length;
assert.equal((await checkout.handler(checkoutRequest('weekly'))).status, 400);
for (const invalidBody of ['{', '[]', 'null', '1', '"monthly"']) {
  assert.equal(
    (await checkout.handler(checkoutRawRequest(invalidBody))).status,
    400,
    `Invalid body ${invalidBody} should be rejected`,
  );
}
assert.equal(checkout.createdSessions.length, sessionsBeforeInvalid);
checkout = await loadCheckout({ annualInterval: 'month' });
assert.equal((await checkout.handler(checkoutRequest('annual'))).status, 503);
assert.equal(checkout.createdSessions.length, 0);
checkout = await loadCheckout({ annualAmount: 299 });
assert.equal((await checkout.handler(checkoutRequest('annual'))).status, 503);
assert.equal(checkout.createdSessions.length, 0);
console.log(
  'Stripe checkout passed: monthly and annual selection, monthly default, interval rejection, and recurring amount/period validation.',
);
