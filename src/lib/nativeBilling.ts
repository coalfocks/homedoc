/**
 * Platform fallback for StoreKit billing. Native iOS builds resolve
 * nativeBilling.ios.ts; other platforms never load the StoreKit module.
 */

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
    /** ISO-8601 period, for example `P1M`. */
    subscriptionPeriod: string | null;
  };
}

export type NativeBillingErrorCode =
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

export class NativeBillingError extends Error {
  readonly code: NativeBillingErrorCode;

  constructor(code: NativeBillingErrorCode, message: string) {
    super(message);
    this.name = 'NativeBillingError';
    this.code = code;
  }
}

const unavailable = (): NativeBillingError =>
  new NativeBillingError(
    'billing_unavailable',
    'Purchases are available in the iOS app. Please try again on an iPhone or iPad.',
  );

export async function getBillingPackages(
  _userId: string,
): Promise<Record<BillingInterval, BillingPackage>> {
  throw unavailable();
}

/** Returns the Apple transaction ID; only the server can confirm entitlement. */
export async function purchaseBillingPackage(
  _userId: string,
  _interval: BillingInterval,
): Promise<string> {
  throw unavailable();
}

/** Returns active transaction IDs matched to the authenticated account token. */
export async function getCurrentEntitlementTransactionIDs(
  _userId: string,
): Promise<string[]> {
  throw unavailable();
}

export function subscribeToTransactionUpdates(
  _userId: string,
  _listener: (transactionId: string) => void,
): { remove: () => void } {
  return { remove: () => undefined };
}

/** Calls StoreKit restore and returns only verified active transaction IDs. */
export async function restorePurchases(_userId: string): Promise<string[]> {
  throw unavailable();
}

/** Finishes a StoreKit transaction after server verification succeeds. */
export async function finishTransaction(_transactionId: string): Promise<void> {
  throw unavailable();
}

export async function manageSubscriptions(_userId: string): Promise<void> {
  throw unavailable();
}
