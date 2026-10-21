import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(
  new URL('../supabase/functions/_shared/app-store.ts', import.meta.url),
  'utf8',
);
const exports = {};
const requests = [];
const writes = [];
let response = { status: 200, body: {} };
const env = { REVENUECAT_SECRET_API_KEY: 'test-server-secret' };
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  {
    exports,
    Date,
    Set,
    Error,
    AbortSignal,
    encodeURIComponent,
    Deno: { env: { get: (key) => env[key] } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: response.status === 200,
        status: response.status,
        json: async () => response.body,
      };
    },
  },
);
const { verifiedAccess, saveAppStoreAccess, isUserId, monthlyProductId } =
  exports;
const id = '00000000-0000-4000-8000-000000000001';
const now = Date.parse('2026-10-20T00:00:00Z');
const subscriber = {
  entitlements: {
    pro: {
      product_identifier: monthlyProductId,
      expires_date: '2099-11-20T00:00:00Z',
    },
  },
  subscriptions: {
    [monthlyProductId]: { store: 'app_store', is_sandbox: false },
  },
};
assert.ok(isUserId(id));
assert.equal(isUserId('$RCAnonymousID:fake'), false);
assert.equal(
  verifiedAccess(subscriber, monthlyProductId, false, now).status,
  'active',
);
for (const change of [
  (s) => (s.entitlements.pro.product_identifier = 'other'),
  (s) => (s.entitlements.pro.expires_date = '2020-01-01T00:00:00Z'),
  (s) => (s.subscriptions[monthlyProductId].store = 'stripe'),
  (s) =>
    (s.subscriptions[monthlyProductId].refunded_at = '2026-10-19T00:00:00Z'),
  (s) => (s.subscriptions[monthlyProductId].is_sandbox = true),
  (s) => delete s.subscriptions[monthlyProductId].is_sandbox,
]) {
  const s = structuredClone(subscriber);
  change(s);
  assert.equal(
    verifiedAccess(s, monthlyProductId, false, now).status,
    'expired',
  );
}
const sandbox = structuredClone(subscriber);
sandbox.subscriptions[monthlyProductId].is_sandbox = true;
assert.equal(
  verifiedAccess(sandbox, monthlyProductId, true, now).status,
  'active',
);
const cancelled = structuredClone(subscriber);
cancelled.subscriptions[monthlyProductId].unsubscribe_detected_at =
  '2026-10-19T00:00:00Z';
assert.equal(
  verifiedAccess(cancelled, monthlyProductId, false, now).status,
  'active',
  'Cancellation retains paid access until expiry',
);
const admin = {
  rpc: async (name, args) => {
    writes.push({ name, args });
    return { error: null };
  },
};
response.body = { subscriber };
await saveAppStoreAccess(admin, id);
assert.equal(writes[0].name, 'save_app_store_entitlement');
assert.equal(writes[0].args.p_status, 'active');
assert.equal(writes[0].args.p_user_id, id);
assert.match(
  requests[0].url,
  /\/subscribers\/00000000-0000-4000-8000-000000000001$/,
);
for (const status of [401, 404, 429, 500]) {
  response.status = status;
  await assert.rejects(saveAppStoreAccess(admin, id));
}
response.status = 200;
response.body = {};
await assert.rejects(saveAppStoreAccess(admin, id));
assert.equal(
  writes.length,
  1,
  'Provider errors must not overwrite a paid entitlement',
);
response.status = 200;
response.body = { subscriber: { entitlements: {}, subscriptions: {} } };
await saveAppStoreAccess(admin, id);
assert.equal(writes[1].args.p_status, 'expired');
const grace = structuredClone(subscriber);
grace.entitlements.pro.expires_date = '2026-10-19T00:00:00Z';
grace.subscriptions[monthlyProductId].grace_period_expires_date =
  '2026-10-21T00:00:00Z';
assert.equal(
  verifiedAccess(grace, monthlyProductId, false, now).status,
  'active',
);
response.status = 200;
response.body = { subscriber: sandbox };
env.APP_STORE_ALLOW_SANDBOX = 'true';
await saveAppStoreAccess(admin, id);
assert.equal(
  writes.at(-1).args.p_status,
  'expired',
  'Sandbox access requires an explicitly allowlisted QA account',
);
env.APP_STORE_SANDBOX_USER_IDS = id;
await saveAppStoreAccess(admin, id);
assert.equal(writes.at(-1).args.p_status, 'active');
delete env.REVENUECAT_SECRET_API_KEY;
await assert.rejects(saveAppStoreAccess(admin, id));
console.log(
  'App Store verification passed: canonical identity, SKU/store/environment/expiry/refund checks, cancellation, fail-closed outages and retry.',
);
