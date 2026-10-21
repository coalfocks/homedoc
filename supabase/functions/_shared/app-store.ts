import { Buffer } from 'node:buffer';
import {
  APIError,
  APIException,
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
  Type,
} from 'npm:@apple/app-store-server-library@3.1.0';
import { appleRootCertificatesBase64 } from './apple-roots.ts';
import { installAppleCertificateCompat } from './apple-certificate-compat.ts';
import { installAppleCurveCompat } from './apple-curve-compat.ts';

export const monthlyProductId = 'com.coalfocks.homedoc.pro.monthly';
export const annualProductId = 'com.coalfocks.homedoc.pro.annual';
export const appBundleId = 'com.coalfocks.homedoc';
export const appAppleId = 6779373725;

type StoreEnvironment = 'Production' | 'Sandbox';
type Transaction = {
  transactionId?: string;
  originalTransactionId?: string;
  bundleId?: string;
  appAccountToken?: string;
  productId?: string;
  type?: string;
  environment?: string;
  expiresDate?: number;
  revocationDate?: number;
  isUpgraded?: boolean;
};
type RenewalInfo = {
  appAccountToken?: string;
  productId?: string;
  environment?: string;
  gracePeriodExpiresDate?: number;
};
type StatusRecord = {
  status?: number;
  signedTransactionInfo?: string;
  signedRenewalInfo?: string;
};
type StatusResponse = {
  environment?: string;
  bundleId?: string;
  appAppleId?: number;
  data?: Array<{ lastTransactions?: StatusRecord[] }>;
};

const appleRootCertificates = appleRootCertificatesBase64.map((certificate) =>
  Buffer.from(certificate, 'base64'),
);
installAppleCurveCompat(appleRootCertificates[2]);
installAppleCertificateCompat(appleRootCertificates[0]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isAppleTransactionId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 30 && /^\d+$/.test(value);
}

export function allowedProductIds(
  monthly = Deno.env.get('APP_STORE_PRO_PRODUCT_ID') || monthlyProductId,
  annual = Deno.env.get('APP_STORE_PRO_ANNUAL_PRODUCT_ID') || annualProductId,
) {
  return [...new Set([monthly, annual].filter((id) => id.trim().length > 0))];
}

export function sandboxAllowedForUser(userId: string) {
  return (
    Deno.env.get('APP_STORE_ALLOW_SANDBOX') === 'true' &&
    (Deno.env.get('APP_STORE_SANDBOX_USER_IDS') || '')
      .split(',')
      .map((id) => id.trim())
      .includes(userId)
  );
}

function appleCredentials() {
  const privateKey = Deno.env.get('APP_STORE_PRIVATE_KEY');
  const keyId = Deno.env.get('APP_STORE_KEY_ID');
  const issuerId = Deno.env.get('APP_STORE_ISSUER_ID');
  if (!privateKey || !keyId || !issuerId) {
    throw new Error('App Store Server API credentials are not configured.');
  }
  return { privateKey: privateKey.replace(/\\n/g, '\n'), keyId, issuerId };
}

function apiClient(environment: StoreEnvironment) {
  const credentials = appleCredentials();
  return new AppStoreServerAPIClient(
    credentials.privateKey,
    credentials.keyId,
    credentials.issuerId,
    appBundleId,
    environment === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX,
  );
}

function verifier(environment: StoreEnvironment) {
  return new SignedDataVerifier(
    appleRootCertificates,
    true,
    environment === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX,
    appBundleId,
    environment === 'Production' ? appAppleId : undefined,
  );
}

function isTransactionIdNotFound(error: unknown) {
  return (
    error instanceof APIException &&
    error.httpStatusCode === 404 &&
    error.apiError === APIError.TRANSACTION_ID_NOT_FOUND
  );
}

function isUnauthorized(error: unknown) {
  return error instanceof APIException && error.httpStatusCode === 401;
}

async function getStatuses(transactionId: string, userId: string) {
  try {
    const response = (await apiClient('Production').getAllSubscriptionStatuses(
      transactionId,
    )) as StatusResponse;
    return { response, environment: 'Production' as const };
  } catch (error) {
    const allowedReviewerFallback =
      sandboxAllowedForUser(userId) &&
      (isTransactionIdNotFound(error) || isUnauthorized(error));
    if (!allowedReviewerFallback) {
      throw new Error('Could not verify the App Store subscription.');
    }
    // Apple's staff has said production API access is unavailable until an app
    // is released (https://developer.apple.com/forums/thread/806452), while
    // App Review IAP tests use Sandbox
    // (https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases/).
    // A pre-release 401 is therefore a plausible gate, not generally expected:
    // Apple's endpoint docs define 401 as an invalid JWT. Keep this retry
    // limited to explicitly allowlisted reviewers and validate Sandbox fully.
    const response = (await apiClient('Sandbox').getAllSubscriptionStatuses(
      transactionId,
    )) as StatusResponse;
    return { response, environment: 'Sandbox' as const };
  }
}

function validateStatusResponse(
  response: StatusResponse,
  environment: StoreEnvironment,
) {
  if (
    response.environment !== environment ||
    response.bundleId !== appBundleId ||
    (environment === 'Production' && response.appAppleId !== appAppleId) ||
    (environment === 'Sandbox' &&
      response.appAppleId !== undefined &&
      response.appAppleId !== appAppleId)
  ) {
    throw new Error('App Store returned a response for a different app.');
  }
}

async function verifiedStatusRecords(
  response: StatusResponse,
  environment: StoreEnvironment,
  userId: string,
) {
  const dataVerifier = verifier(environment);
  const records: Array<{
    status: number | undefined;
    transaction: Transaction;
    renewal: RenewalInfo | null;
  }> = [];

  for (const group of response.data || []) {
    for (const item of group.lastTransactions || []) {
      if (!item.signedTransactionInfo) continue;
      const transaction = (await dataVerifier.verifyAndDecodeTransaction(
        item.signedTransactionInfo,
      )) as Transaction;
      if (
        transaction.bundleId !== appBundleId ||
        transaction.environment !== environment
      ) {
        throw new Error('App Store transaction identity did not match.');
      }

      let renewal: RenewalInfo | null = null;
      if (item.signedRenewalInfo) {
        renewal = (await dataVerifier.verifyAndDecodeRenewalInfo(
          item.signedRenewalInfo,
        )) as RenewalInfo;
        if (
          renewal.environment !== environment ||
          (renewal.appAccountToken &&
            renewal.appAccountToken.toLowerCase() !==
              transaction.appAccountToken?.toLowerCase()) ||
          (renewal.productId && renewal.productId !== transaction.productId)
        ) {
          throw new Error('App Store renewal identity did not match.');
        }
      }

      // Ignore other subscriptions in the same Apple response. A matching
      // account token must be present before this user can be updated.
      if (transaction.appAccountToken?.toLowerCase() !== userId.toLowerCase())
        continue;
      records.push({ status: item.status, transaction, renewal });
    }
  }

  if (records.length === 0) {
    throw new Error(
      'The App Store subscription belongs to a different account.',
    );
  }
  return records;
}

function makeAccess(
  records: Awaited<ReturnType<typeof verifiedStatusRecords>>,
  environment: StoreEnvironment,
  observedAt = new Date(),
) {
  const now = observedAt.getTime();
  const products = allowedProductIds();
  const candidates = records.map(({ status, transaction, renewal }) => {
    const productId = transaction.productId || '';
    const transactionExpiry = transaction.expiresDate || 0;
    const graceExpiry = renewal?.gracePeriodExpiresDate || 0;
    const expiration = status === 4 ? graceExpiry : transactionExpiry;
    const active =
      products.includes(productId) &&
      transaction.type === Type.AUTO_RENEWABLE_SUBSCRIPTION &&
      !transaction.revocationDate &&
      transaction.isUpgraded !== true &&
      expiration > now &&
      (status === 1 || (status === 4 && graceExpiry > now));
    return { active, productId, expiration, transaction };
  });
  const selected =
    candidates
      .filter((candidate) => candidate.active)
      .sort((a, b) => b.expiration - a.expiration)[0] ||
    candidates.sort(
      (a, b) =>
        (b.transaction.expiresDate || 0) - (a.transaction.expiresDate || 0),
    )[0];
  return {
    status: selected.active ? 'active' : 'expired',
    productId: selected.productId,
    expiresAt:
      selected.expiration > 0
        ? new Date(selected.expiration).toISOString()
        : null,
    environment: environment.toLowerCase(),
    observedAt: observedAt.toISOString(),
  };
}

export async function loadAppStoreAccess(
  userId: string,
  transactionId: string,
) {
  if (!isUserId(userId) || !isAppleTransactionId(transactionId)) {
    throw new Error(
      'An authenticated account and Apple transaction ID are required.',
    );
  }
  // Stamp the observation when the canonical request starts, not when Apple
  // responds. Otherwise an older, slower response can appear newer and replace
  // a subscription state observed by a later request.
  const observedAt = new Date();
  const { response, environment } = await getStatuses(transactionId, userId);
  validateStatusResponse(response, environment);
  const records = await verifiedStatusRecords(response, environment, userId);
  return makeAccess(records, environment, observedAt);
}

export async function verifiedNotification(signedPayload: string) {
  let payload: Awaited<
    ReturnType<ReturnType<typeof verifier>['verifyAndDecodeNotification']>
  >;
  let environment: StoreEnvironment;
  try {
    payload =
      await verifier('Production').verifyAndDecodeNotification(signedPayload);
    environment = 'Production';
  } catch {
    // Verify sandbox notices so Apple receives an acknowledgement, then let
    // the webhook's explicit user allowlist decide whether they can sync.
    payload =
      await verifier('Sandbox').verifyAndDecodeNotification(signedPayload);
    environment = 'Sandbox';
  }

  const notificationData = payload.data;
  if (
    notificationData &&
    (notificationData.bundleId !== appBundleId ||
      notificationData.environment !== environment ||
      (notificationData.appAppleId !== undefined &&
        notificationData.appAppleId !== appAppleId) ||
      (environment === 'Production' &&
        notificationData.appAppleId !== appAppleId))
  ) {
    throw new Error('App Store notification identity did not match.');
  }

  const signedTransactionInfo = payload.data?.signedTransactionInfo;
  const signedRenewalInfo = payload.data?.signedRenewalInfo;
  if (!signedTransactionInfo)
    return { payload, environment, transaction: null };
  const dataVerifier = verifier(environment);
  const transaction = (await dataVerifier.verifyAndDecodeTransaction(
    signedTransactionInfo,
  )) as Transaction;
  if (signedRenewalInfo) {
    const renewal = (await dataVerifier.verifyAndDecodeRenewalInfo(
      signedRenewalInfo,
    )) as RenewalInfo;
    if (
      (renewal.appAccountToken &&
        renewal.appAccountToken.toLowerCase() !==
          transaction.appAccountToken?.toLowerCase()) ||
      (renewal.productId && renewal.productId !== transaction.productId)
    ) {
      throw new Error('App Store notification renewal identity did not match.');
    }
  }
  return { payload, environment, transaction };
}

export async function saveAppStoreAccess(
  admin: {
    rpc: (
      name: string,
      args: Record<string, unknown>,
    ) => PromiseLike<{ error: unknown }>;
  },
  userId: string,
  transactionId: string,
) {
  const access = await loadAppStoreAccess(userId, transactionId);
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
