import Constants from 'expo-constants';
import { Linking } from 'react-native';
import StoreKit, {
  type NativeStoreProduct,
  type NativeStoreTransactionUpdate,
} from '../../modules/homedoc-storekit/src';

export type BillingInterval = 'monthly' | 'annual';

export interface BillingPackage {
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
  | 'annual_plan_unavailable'
  | 'purchase_cancelled'
  | 'purchase_pending'
  | 'purchase_failed'
  | 'transaction_finish_failed'
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
const DEFAULT_PRO_ANNUAL_PRODUCT_ID = 'com.coalfocks.homedoc.pro.annual';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRANSACTION_ID_PATTERN = /^\d+$/;

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

function expectedProductId(interval: BillingInterval): string {
  const extra = Constants.expoConfig?.extra ?? {};
  if (interval === 'monthly') {
    return (
      process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID ||
      (typeof extra.appStoreProProductId === 'string'
        ? extra.appStoreProProductId
        : '') ||
      DEFAULT_PRO_MONTHLY_PRODUCT_ID
    );
  }
  return (
    process.env.EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID ||
    (typeof extra.appStoreProAnnualProductId === 'string'
      ? extra.appStoreProAnnualProductId
      : '') ||
    DEFAULT_PRO_ANNUAL_PRODUCT_ID
  );
}

function expectedProductIds(): string[] {
  return [
    ...new Set([expectedProductId('monthly'), expectedProductId('annual')]),
  ];
}

function unavailableCode(interval: BillingInterval): NativeBillingErrorCode {
  return interval === 'monthly'
    ? 'monthly_plan_unavailable'
    : 'annual_plan_unavailable';
}

function periodFor(interval: BillingInterval): string {
  return interval === 'monthly' ? 'P1M' : 'P1Y';
}

function toBillingPackage(
  product: NativeStoreProduct | undefined,
  interval: BillingInterval,
): BillingPackage {
  if (
    !product ||
    product.productId !== expectedProductId(interval) ||
    product.subscriptionPeriod !== periodFor(interval) ||
    product.isAutoRenewable !== true
  ) {
    throw billingError(
      unavailableCode(interval),
      `The ${interval} plan is temporarily unavailable. Please try again later.`,
    );
  }

  return {
    identifier: interval,
    packageType: interval === 'monthly' ? 'MONTHLY' : 'ANNUAL',
    product: {
      identifier: product.productId,
      title: product.title,
      description: product.description,
      price: product.price,
      priceString: product.priceString,
      currencyCode: product.currencyCode,
      subscriptionPeriod: product.subscriptionPeriod,
    },
  };
}

async function loadPackages(): Promise<
  Record<BillingInterval, BillingPackage>
> {
  try {
    const products = await StoreKit.getProducts(expectedProductIds());
    return {
      monthly: toBillingPackage(
        products.find(
          (product) => product.productId === expectedProductId('monthly'),
        ),
        'monthly',
      ),
      annual: toBillingPackage(
        products.find(
          (product) => product.productId === expectedProductId('annual'),
        ),
        'annual',
      ),
    };
  } catch (error) {
    if (error instanceof NativeBillingError) throw error;
    throw billingError(
      'billing_unavailable',
      'Purchases are temporarily unavailable. Please try again later.',
    );
  }
}

export async function getBillingPackages(
  userId: string,
): Promise<Record<BillingInterval, BillingPackage>> {
  return enqueue(async () => {
    validateUserId(userId);
    return loadPackages();
  });
}

export async function purchaseBillingPackage(
  userId: string,
  interval: BillingInterval,
): Promise<string> {
  return enqueue(async () => {
    validateUserId(userId);
    const selected = (await loadPackages())[interval];
    let result;
    try {
      result = await StoreKit.purchase(selected.product.identifier, userId);
    } catch {
      throw billingError(
        'purchase_failed',
        'The purchase could not be completed. Please try again.',
      );
    }

    if (result.status === 'cancelled') {
      throw billingError('purchase_cancelled', 'Purchase cancelled.');
    }
    if (result.status === 'pending') {
      throw billingError(
        'purchase_pending',
        'This purchase is pending Apple approval. HomeDoc Pro will activate when Apple approves it.',
      );
    }
    if (
      result.status !== 'purchased' ||
      result.productId !== selected.product.identifier ||
      !TRANSACTION_ID_PATTERN.test(result.transactionId)
    ) {
      throw billingError(
        'purchase_failed',
        'Apple did not return a verified transaction for this plan.',
      );
    }
    return result.transactionId;
  });
}

export async function getCurrentEntitlementTransactionIDs(
  userId: string,
): Promise<string[]> {
  return enqueue(async () => {
    validateUserId(userId);
    try {
      return await StoreKit.getCurrentEntitlements(
        userId,
        expectedProductIds(),
      );
    } catch {
      throw billingError(
        'billing_unavailable',
        'Apple subscription information is temporarily unavailable.',
      );
    }
  });
}

export function subscribeToTransactionUpdates(
  userId: string,
  listener: (transactionId: string) => void,
): { remove: () => void } {
  validateUserId(userId);
  const accountToken = userId.toLowerCase();
  const productIDs = new Set(expectedProductIds());
  return StoreKit.addListener(
    'onTransactionUpdate',
    (update: NativeStoreTransactionUpdate) => {
      if (
        !update ||
        !TRANSACTION_ID_PATTERN.test(update.transactionId) ||
        !productIDs.has(update.productId) ||
        typeof update.appAccountToken !== 'string' ||
        update.appAccountToken.toLowerCase() !== accountToken
      ) {
        return;
      }
      listener(update.transactionId);
    },
  );
}

export async function restorePurchases(userId: string): Promise<string[]> {
  return enqueue(async () => {
    validateUserId(userId);
    try {
      return await StoreKit.restorePurchases(userId, expectedProductIds());
    } catch {
      throw billingError(
        'restore_failed',
        'Purchases could not be restored. Please try again.',
      );
    }
  });
}

export async function finishTransaction(transactionId: string): Promise<void> {
  return enqueue(async () => {
    if (!TRANSACTION_ID_PATTERN.test(transactionId)) {
      throw billingError(
        'transaction_finish_failed',
        'The App Store transaction could not be finished. Restore purchases to retry.',
      );
    }
    try {
      // A false return means Apple already considers this transaction finished.
      await StoreKit.finishTransaction(transactionId);
    } catch {
      throw billingError(
        'transaction_finish_failed',
        'Your subscription is active, but Apple could not finish syncing it. Restore purchases to retry.',
      );
    }
  });
}

export async function manageSubscriptions(userId: string): Promise<void> {
  return enqueue(async () => {
    validateUserId(userId);
    try {
      await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
    } catch {
      throw billingError(
        'manage_failed',
        'Subscription settings could not be opened. Please try again.',
      );
    }
  });
}
