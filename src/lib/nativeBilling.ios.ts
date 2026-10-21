import Constants from 'expo-constants';
import { Linking } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

interface MonthlyBillingPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod: string | null;
  };
}

type NativeBillingErrorCode =
  | 'billing_unavailable'
  | 'invalid_user'
  | 'monthly_plan_unavailable'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'restore_failed'
  | 'manage_failed';

class NativeBillingError extends Error {
  readonly code: NativeBillingErrorCode;

  constructor(code: NativeBillingErrorCode, message: string) {
    super(message);
    this.name = 'NativeBillingError';
    this.code = code;
  }
}

const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const DEFAULT_PRO_MONTHLY_PRODUCT_ID = 'com.coalfocks.homedoc.pro.monthly';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let configured = false;
let operationQueue: Promise<void> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function billingError(
  code: NativeBillingErrorCode,
  message: string,
): NativeBillingError {
  return new NativeBillingError(code, message);
}

function validateUserId(userId: string): void {
  if (!UUID_PATTERN.test(userId)) {
    throw billingError(
      'invalid_user',
      'Please sign in again to manage your subscription.',
    );
  }
}

function apiKey(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  const key =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
    (typeof extra.revenueCatIosApiKey === 'string'
      ? extra.revenueCatIosApiKey
      : '');

  const normalizedKey = key.trim();
  if (!normalizedKey || (!__DEV__ && normalizedKey.startsWith('test_'))) {
    throw billingError(
      'billing_unavailable',
      'Purchases are temporarily unavailable. Please try again later.',
    );
  }

  return normalizedKey;
}

function expectedMonthlyProductId(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  return (
    process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID ||
    (typeof extra.appStoreProProductId === 'string'
      ? extra.appStoreProProductId
      : '') ||
    DEFAULT_PRO_MONTHLY_PRODUCT_ID
  );
}

async function ensureIdentity(userId: string): Promise<void> {
  validateUserId(userId);

  if (!configured) {
    Purchases.configure({ apiKey: apiKey(), appUserID: userId });
    configured = true;
    return;
  }

  const activeUserId = await Purchases.getAppUserID();
  if (activeUserId !== userId) {
    await Purchases.logIn(userId);
  }
}

async function loadMonthlyPackage(): Promise<PurchasesPackage> {
  try {
    const offerings = await Purchases.getOfferings();
    const monthly = offerings.current?.monthly;
    if (!monthly) {
      throw billingError(
        'monthly_plan_unavailable',
        'The monthly plan is temporarily unavailable. Please try again later.',
      );
    }
    if (
      monthly.product.identifier !== expectedMonthlyProductId() ||
      monthly.product.subscriptionPeriod !== 'P1M'
    ) {
      throw billingError(
        'monthly_plan_unavailable',
        'The monthly plan is temporarily unavailable. Please try again later.',
      );
    }
    return monthly;
  } catch (error) {
    if (error instanceof NativeBillingError) throw error;
    throw billingError(
      'monthly_plan_unavailable',
      'The monthly plan is temporarily unavailable. Please try again later.',
    );
  }
}

function isCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { userCancelled?: unknown; code?: unknown };
  return (
    candidate.userCancelled === true ||
    candidate.code === 'PURCHASE_CANCELLED_ERROR' ||
    candidate.code === '1'
  );
}

export async function getMonthlyPackage(
  userId: string,
): Promise<MonthlyBillingPackage> {
  return enqueue(async () => {
    await ensureIdentity(userId);
    const monthly = await loadMonthlyPackage();
    // RevenueCat's typed package carries the localized price and ISO period on
    // `product`; the returned object remains the SDK package, not a price copy.
    return monthly as PurchasesPackage & MonthlyBillingPackage;
  });
}

export async function purchaseMonthly(userId: string): Promise<void> {
  return enqueue(async () => {
    await ensureIdentity(userId);
    const monthly = await loadMonthlyPackage();
    try {
      await Purchases.purchasePackage(monthly);
      // The server validates the App Store transaction independently after
      // this succeeds. Client entitlement data is neither returned nor trusted.
    } catch (error) {
      if (isCancelled(error)) {
        throw billingError('purchase_cancelled', 'Purchase cancelled.');
      }
      if (error instanceof NativeBillingError) throw error;
      throw billingError(
        'purchase_failed',
        'The purchase could not be completed. Please try again.',
      );
    }
  });
}

export async function restorePurchases(userId: string): Promise<void> {
  return enqueue(async () => {
    await ensureIdentity(userId);
    try {
      await Purchases.restorePurchases();
      // CustomerInfo is deliberately not returned or treated as server truth.
    } catch {
      throw billingError(
        'restore_failed',
        'Purchases could not be restored. Please try again.',
      );
    }
  });
}

function safeAppleSubscriptionsUrl(candidate: string | null): string | null {
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (
      url.protocol === 'https:' &&
      url.hostname === 'apps.apple.com' &&
      url.pathname === '/account/subscriptions'
    ) {
      return url.toString();
    }
  } catch {
    // Fall back to Apple's fixed subscriptions page below.
  }
  return null;
}

export async function manageSubscriptions(userId: string): Promise<void> {
  return enqueue(async () => {
    await ensureIdentity(userId);
    let url = APPLE_SUBSCRIPTIONS_URL;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      url = safeAppleSubscriptionsUrl(customerInfo.managementURL) ?? url;
    } catch {
      // Apple's fixed subscriptions URL is available even if CustomerInfo is not.
    }

    try {
      await Linking.openURL(url);
    } catch {
      throw billingError(
        'manage_failed',
        'Subscription settings could not be opened. Please try again.',
      );
    }
  });
}
