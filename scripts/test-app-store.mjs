import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import {
  Environment,
  SignedDataVerifier,
} from '@apple/app-store-server-library';

const USER_A = '00000000-0000-4000-8000-000000000001';
const USER_B = '00000000-0000-4000-8000-000000000002';
const BUNDLE_ID = 'com.coalfocks.homedoc';
const APPLE_APP_ID = 6779373725;
const MONTHLY = 'com.coalfocks.homedoc.pro.monthly';
const ANNUAL = 'com.coalfocks.homedoc.pro.annual';
const now = Date.parse('2026-10-20T00:00:00Z');

const rootsSource = await readFile(
  new URL('../supabase/functions/_shared/apple-roots.ts', import.meta.url),
  'utf8',
);
const rootsExports = {};
vm.runInNewContext(
  ts.transpileModule(rootsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: rootsExports },
);
const roots = Array.from(rootsExports.appleRootCertificatesBase64, (root) =>
  Buffer.from(root, 'base64'),
);
assert.equal(roots.length, 3);
const appleVerifier = new SignedDataVerifier(
  roots,
  false,
  Environment.PRODUCTION,
  BUNDLE_ID,
  APPLE_APP_ID,
);
await assert.rejects(
  appleVerifier.verifyAndDecodeTransaction('eyJhbGciOiJub25lIn0.eyJ4IjoxfQ.'),
  'Apple signed-data verifier rejects a forged compact JWS',
);

const state = {
  env: {
    APP_STORE_PRIVATE_KEY: 'test-private-key',
    APP_STORE_KEY_ID: 'KEY1234567',
    APP_STORE_ISSUER_ID: '11111111-2222-3333-4444-555555555555',
  },
  jws: new Map(),
  responses: {},
  apiErrors: {},
  apiCalls: [],
  writes: [],
};
class MockAPIException extends Error {
  constructor(httpStatusCode, apiError) {
    super('Mock Apple API error');
    this.httpStatusCode = httpStatusCode;
    this.apiError = apiError;
  }
}
class MockAPIClient {
  constructor(_privateKey, _keyId, _issuerId, bundleId, environment) {
    assert.equal(bundleId, BUNDLE_ID);
    this.environment = environment;
  }
  async getAllSubscriptionStatuses(transactionId) {
    state.apiCalls.push({ environment: this.environment, transactionId });
    const error = state.apiErrors[this.environment];
    if (error) throw error;
    const response = state.responses[this.environment];
    if (typeof response === 'function') return response(transactionId);
    return response;
  }
}
class MockSignedDataVerifier {
  constructor(_roots, _onlineChecks, environment, bundleId, appleId) {
    assert.equal(bundleId, BUNDLE_ID);
    if (environment === 'Production') assert.equal(appleId, APPLE_APP_ID);
    this.environment = environment;
  }
  async decode(kind, signed) {
    const payload = state.jws.get(`${kind}:${signed}`);
    if (!payload) throw new Error('Invalid signed Apple data');
    return payload;
  }
  verifyAndDecodeTransaction(signed) {
    return this.decode('transaction', signed);
  }
  verifyAndDecodeRenewalInfo(signed) {
    return this.decode('renewal', signed);
  }
  verifyAndDecodeNotification(signed) {
    return this.decode('notification', signed).then((payload) => {
      if (payload.data?.environment !== this.environment) {
        throw new Error('Incorrect notification environment');
      }
      return payload;
    });
  }
}
const appleLibrary = {
  APIError: { TRANSACTION_ID_NOT_FOUND: 4040010 },
  APIException: MockAPIException,
  AppStoreServerAPIClient: MockAPIClient,
  Environment: { PRODUCTION: 'Production', SANDBOX: 'Sandbox' },
  SignedDataVerifier: MockSignedDataVerifier,
  Type: { AUTO_RENEWABLE_SUBSCRIPTION: 'Auto-Renewable Subscription' },
};
const sharedSource = await readFile(
  new URL('../supabase/functions/_shared/app-store.ts', import.meta.url),
  'utf8',
);
const exports = {};
vm.runInNewContext(
  ts.transpileModule(sharedSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText,
  {
    exports,
    Date,
    Set,
    Error,
    Buffer,
    Deno: { env: { get: (key) => state.env[key] } },
    require: (path) => {
      if (path === 'node:buffer') return { Buffer };
      if (path === 'npm:@apple/app-store-server-library@3.1.0')
        return appleLibrary;
      if (path === './apple-roots.ts')
        return { appleRootCertificatesBase64: ['dGVzdA=='] };
      throw new Error(`Unexpected import ${path}`);
    },
  },
);

const {
  isUserId,
  isAppleTransactionId,
  loadAppStoreAccess,
  saveAppStoreAccess,
  sandboxAllowedForUser,
  verifiedNotification,
  monthlyProductId,
  annualProductId,
  allowedProductIds,
} = exports;
assert.ok(isUserId(USER_A));
assert.ok(isAppleTransactionId('12345678901234567890'));
assert.equal(isAppleTransactionId('1'.repeat(31)), false);
assert.equal(isAppleTransactionId('123x'), false);
assert.equal(isUserId('$RCAnonymousID:fake'), false);
assert.equal(monthlyProductId, MONTHLY);
assert.equal(annualProductId, ANNUAL);
assert.deepEqual(Array.from(allowedProductIds()), [MONTHLY, ANNUAL]);

let nextSignedDataId = 0;
const signFixture = (kind, payload) => {
  const signed = `fixture-${++nextSignedDataId}`;
  state.jws.set(`${kind}:${signed}`, payload);
  return signed;
};
const transaction = (userId, productId = MONTHLY, options = {}) => ({
  transactionId: options.transactionId || String(1000 + nextSignedDataId),
  originalTransactionId: '987654321',
  bundleId: BUNDLE_ID,
  appAccountToken: userId,
  productId,
  type: 'Auto-Renewable Subscription',
  environment: options.environment || 'Production',
  expiresDate: options.expiresDate ?? Date.parse('2099-11-20T00:00:00Z'),
  ...(options.revocationDate ? { revocationDate: options.revocationDate } : {}),
  ...(options.isUpgraded ? { isUpgraded: true } : {}),
});
const renewal = (userId, productId = MONTHLY, options = {}) => ({
  appAccountToken: userId,
  productId,
  environment: options.environment || 'Production',
  ...(options.gracePeriodExpiresDate
    ? { gracePeriodExpiresDate: options.gracePeriodExpiresDate }
    : {}),
});
function statusResponse(records, environment = 'Production') {
  return {
    environment,
    bundleId: BUNDLE_ID,
    appAppleId: APPLE_APP_ID,
    data: [
      {
        lastTransactions: records.map((record) => ({
          status: record.status,
          signedTransactionInfo: signFixture('transaction', record.transaction),
          ...(record.renewal
            ? { signedRenewalInfo: signFixture('renewal', record.renewal) }
            : {}),
        })),
      },
    ],
  };
}
function setProductionResponse(records) {
  state.responses.Production = statusResponse(records);
  state.apiErrors.Production = null;
  state.apiErrors.Sandbox = null;
}
const admin = {
  rpc: async (name, args) => {
    state.writes.push({ name, args });
    return { error: null };
  },
};

setProductionResponse([{ status: 1, transaction: transaction(USER_A) }]);
const monthlyAccess = await saveAppStoreAccess(admin, USER_A, '10001');
assert.equal(monthlyAccess.status, 'active');
assert.equal(monthlyAccess.productId, MONTHLY);
assert.equal(state.writes.at(-1).args.p_user_id, USER_A);
assert.equal(state.writes.at(-1).args.p_environment, 'production');
assert.equal(state.apiCalls.at(-1).transactionId, '10001');

setProductionResponse([
  { status: 1, transaction: transaction(USER_A, ANNUAL) },
]);
const annualAccess = await loadAppStoreAccess(USER_A, '10002');
assert.equal(annualAccess.status, 'active');
assert.equal(annualAccess.productId, ANNUAL);

setProductionResponse([
  { status: 1, transaction: transaction(USER_B, MONTHLY) },
]);
const writesBeforeMismatch = state.writes.length;
await assert.rejects(loadAppStoreAccess(USER_A, '10003'));
assert.equal(state.writes.length, writesBeforeMismatch);

setProductionResponse([
  { status: 1, transaction: transaction(USER_B, MONTHLY) },
  { status: 1, transaction: transaction(USER_A, ANNUAL) },
]);
assert.equal((await loadAppStoreAccess(USER_A, '10004')).productId, ANNUAL);

for (const [status, options] of [
  [2, {}],
  [3, {}],
  [5, {}],
  [1, { expiresDate: Date.parse('2020-01-01T00:00:00Z') }],
  [1, { revocationDate: now - 1 }],
  [1, { isUpgraded: true }],
  [1, { productId: 'unknown.product' }],
]) {
  const productId = options.productId || MONTHLY;
  setProductionResponse([
    {
      status,
      transaction: transaction(USER_A, productId, options),
      renewal: renewal(USER_A, productId),
    },
  ]);
  const access = await loadAppStoreAccess(USER_A, '10005');
  assert.equal(access.status, 'expired');
}

setProductionResponse([
  {
    status: 4,
    transaction: transaction(USER_A, ANNUAL, {
      expiresDate: Date.parse('2026-10-19T00:00:00Z'),
    }),
    renewal: renewal(USER_A, ANNUAL, {
      gracePeriodExpiresDate: Date.parse('2099-10-21T00:00:00Z'),
    }),
  },
]);
assert.equal((await loadAppStoreAccess(USER_A, '10006')).status, 'active');
setProductionResponse([
  {
    status: 4,
    transaction: transaction(USER_A, ANNUAL, {
      expiresDate: Date.parse('2026-10-19T00:00:00Z'),
    }),
    renewal: renewal(USER_A, ANNUAL, {
      gracePeriodExpiresDate: Date.parse('2026-10-19T00:00:00Z'),
    }),
  },
]);
assert.equal((await loadAppStoreAccess(USER_A, '10007')).status, 'expired');

setProductionResponse([{ status: 1, transaction: transaction(USER_A) }]);
state.responses.Sandbox = statusResponse(
  [
    {
      status: 1,
      transaction: transaction(USER_A, ANNUAL, { environment: 'Sandbox' }),
    },
  ],
  'Sandbox',
);
state.apiErrors.Production = new MockAPIException(404, 4040010);
assert.equal(sandboxAllowedForUser(USER_A), false);
const callsBeforeSandboxBlock = state.apiCalls.length;
await assert.rejects(loadAppStoreAccess(USER_A, '10008'));
assert.equal(state.apiCalls.length, callsBeforeSandboxBlock + 1);
state.env.APP_STORE_ALLOW_SANDBOX = 'true';
state.env.APP_STORE_SANDBOX_USER_IDS = USER_A;
assert.equal(sandboxAllowedForUser(USER_A), true);
assert.equal(
  (await loadAppStoreAccess(USER_A, '10009')).environment,
  'sandbox',
);
state.env.APP_STORE_SANDBOX_USER_IDS = USER_B;
const callsBeforeOtherSandbox = state.apiCalls.length;
await assert.rejects(loadAppStoreAccess(USER_A, '10010'));
assert.equal(state.apiCalls.length, callsBeforeOtherSandbox + 1);
state.env.APP_STORE_ALLOW_SANDBOX = 'false';
state.env.APP_STORE_SANDBOX_USER_IDS = '';
state.apiErrors.Production = null;
state.apiErrors.Sandbox = null;

state.responses.Production = {
  ...statusResponse([{ status: 1, transaction: transaction(USER_A) }]),
  appAppleId: 123,
};
await assert.rejects(loadAppStoreAccess(USER_A, '10011'));
state.responses.Production = statusResponse([
  {
    status: 1,
    transaction: transaction(USER_A),
    renewal: renewal(USER_B),
  },
]);
await assert.rejects(loadAppStoreAccess(USER_A, '10012'));
await assert.rejects(loadAppStoreAccess(USER_A, 'unknown'));
const apiCallsBeforeLongTransaction = state.apiCalls.length;
await assert.rejects(loadAppStoreAccess(USER_A, '1'.repeat(31)));
assert.equal(state.apiCalls.length, apiCallsBeforeLongTransaction);

let resolveOlderResponse;
state.responses.Production = (transactionId) =>
  transactionId === '10014'
    ? new Promise((resolve) => {
        resolveOlderResponse = resolve;
      })
    : statusResponse([{ status: 1, transaction: transaction(USER_A) }]);
let persistedAccess;
const orderingAdmin = {
  rpc: async (_name, args) => {
    if (
      !persistedAccess ||
      Date.parse(args.p_observed_at) >=
        Date.parse(persistedAccess.p_observed_at)
    ) {
      persistedAccess = args;
    }
    return { error: null };
  },
};
const olderRequest = saveAppStoreAccess(orderingAdmin, USER_A, '10014');
while (!resolveOlderResponse) await Promise.resolve();
await new Promise((resolve) => setTimeout(resolve, 10));
const newerObservation = await saveAppStoreAccess(
  orderingAdmin,
  USER_A,
  '10015',
);
resolveOlderResponse(
  statusResponse([
    {
      status: 2,
      transaction: transaction(USER_A, MONTHLY, {
        expiresDate: Date.parse('2020-01-01T00:00:00Z'),
      }),
    },
  ]),
);
const olderObservation = await olderRequest;
assert.ok(
  Date.parse(olderObservation.observedAt) <
    Date.parse(newerObservation.observedAt),
  'A slower older Apple response keeps its request-start observation time',
);
assert.equal(newerObservation.status, 'active');
assert.equal(olderObservation.status, 'expired');
assert.equal(
  persistedAccess.p_status,
  'active',
  'The delayed older response cannot overwrite the newer saved observation',
);

const signedNotification = signFixture('notification', {
  notificationType: 'DID_RENEW',
  data: {
    bundleId: BUNDLE_ID,
    appAppleId: APPLE_APP_ID,
    environment: 'Production',
    signedTransactionInfo: signFixture(
      'transaction',
      transaction(USER_A, ANNUAL),
    ),
    signedRenewalInfo: signFixture('renewal', renewal(USER_A, ANNUAL)),
  },
});
const verified = await verifiedNotification(signedNotification);
assert.equal(verified.transaction.appAccountToken, USER_A);
assert.equal(verified.environment, 'Production');
setProductionResponse([
  {
    status: 2,
    transaction: transaction(USER_A, ANNUAL, {
      expiresDate: Date.parse('2020-01-01T00:00:00Z'),
    }),
  },
]);
const replayedNotificationAccess = await saveAppStoreAccess(
  admin,
  USER_A,
  verified.transaction.transactionId,
);
assert.equal(
  replayedNotificationAccess.status,
  'expired',
  'A stale active notification cannot override the current Apple status response',
);
const signedSandboxNotification = signFixture('notification', {
  notificationType: 'DID_RENEW',
  data: {
    bundleId: BUNDLE_ID,
    appAppleId: APPLE_APP_ID,
    environment: 'Sandbox',
    signedTransactionInfo: signFixture(
      'transaction',
      transaction(USER_A, MONTHLY, { environment: 'Sandbox' }),
    ),
  },
});
const sandboxNotification = await verifiedNotification(
  signedSandboxNotification,
);
assert.equal(sandboxNotification.environment, 'Sandbox');
assert.equal(
  sandboxAllowedForUser(USER_A),
  false,
  'A verified sandbox notice remains blocked unless its account is allowlisted',
);
await assert.rejects(verifiedNotification('forged.payload.signature'));
assert.equal(
  state.writes.every((write) => write.name === 'save_app_store_entitlement'),
  true,
);

delete state.env.APP_STORE_PRIVATE_KEY;
await assert.rejects(loadAppStoreAccess(USER_A, '10013'));
console.log(
  'Apple App Store verification passed: pinned SKUs, identity binding, signed transaction/renewal checks, active/expired/grace/revocation, sandbox allowlist, app identity, and invalid-JWS rejection.',
);
