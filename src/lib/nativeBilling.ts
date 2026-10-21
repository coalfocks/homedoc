/**
 * Platform fallback for RevenueCat billing. Native iOS builds resolve
 * nativeBilling.ios.ts; other platforms intentionally never load the native
 * purchase SDK.
 */

export interface MonthlyBillingPackage {
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
  | 'purchase_cancelled'
  | 'purchase_failed'
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

export async function getMonthlyPackage(
  _userId: string,
): Promise<MonthlyBillingPackage> {
  throw unavailable();
}

/** Returns only after the App Store purchase completes; entitlement authority stays on the server. */
export async function purchaseMonthly(_userId: string): Promise<void> {
  throw unavailable();
}

/** Returns only after the App Store restore completes; entitlement authority stays on the server. */
export async function restorePurchases(_userId: string): Promise<void> {
  throw unavailable();
}

export async function manageSubscriptions(_userId: string): Promise<void> {
  throw unavailable();
}
