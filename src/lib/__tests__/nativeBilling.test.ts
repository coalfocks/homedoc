let mockActiveUserId = '';
let mockMonthlyPackage: Record<string, any>;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn(async () => undefined) },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn((configuration) => {
      mockActiveUserId = configuration.appUserID;
    }),
    getAppUserID: jest.fn(async () => mockActiveUserId),
    logIn: jest.fn(async (userId) => {
      mockActiveUserId = userId;
      return { customerInfo: {}, created: false };
    }),
    getOfferings: jest.fn(async () => ({
      current: { monthly: mockMonthlyPackage },
    })),
    purchasePackage: jest.fn(async () => ({ customerInfo: {} })),
    restorePurchases: jest.fn(async () => ({})),
    getCustomerInfo: jest.fn(async () => ({ managementURL: null })),
  },
}));

const USER_A = '0a9c9c15-4da4-414e-a6a7-693b0633da11';
const USER_B = 'a0b9c9ea-0797-4bb8-b86f-bddf4ff23aab';
const MONTHLY_SKU = 'com.coalfocks.homedoc.pro.monthly';

function validMonthlyPackage() {
  return {
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    offeringIdentifier: 'default',
    presentedOfferingContext: null,
    webCheckoutUrl: null,
    product: {
      identifier: MONTHLY_SKU,
      title: 'HomeDoc Pro',
      description: 'Monthly subscription',
      price: 8.99,
      priceString: '$8.99',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1M',
    },
  };
}

describe('native billing adapter', () => {
  let billing: typeof import('../nativeBilling.ios');
  let purchases: any;
  let constants: any;
  let linking: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'test_public_key';
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID;
    (global as any).__DEV__ = true;
    mockActiveUserId = '';
    mockMonthlyPackage = validMonthlyPackage();

    billing = require('../nativeBilling.ios');
    purchases = require('react-native-purchases').default;
    constants = require('expo-constants').default;
    linking = require('react-native').Linking;
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID;
    delete (global as any).__DEV__;
  });

  it('returns the current package with localized price and monthly period', async () => {
    const result = await billing.getMonthlyPackage(USER_A);

    expect(result.product.priceString).toBe('$8.99');
    expect(result.product.subscriptionPeriod).toBe('P1M');
    expect(purchases.configure).toHaveBeenCalledWith({
      apiKey: 'test_public_key',
      appUserID: USER_A,
    });
    expect(purchases.getOfferings).toHaveBeenCalledTimes(1);
  });

  it('serializes account switching behind an in-flight purchase', async () => {
    let finishPurchase!: () => void;
    let userAtPurchase: string | undefined;
    purchases.purchasePackage.mockImplementation(
      () =>
        new Promise((resolve) => {
          userAtPurchase = mockActiveUserId;
          finishPurchase = () => resolve({ customerInfo: {} });
        }),
    );

    const purchase = billing.purchaseMonthly(USER_A);
    while (!finishPurchase) await Promise.resolve();
    const nextAccountRead = billing.getMonthlyPackage(USER_B);

    expect(userAtPurchase).toBe(USER_A);
    expect(purchases.logIn).not.toHaveBeenCalled();

    finishPurchase();
    await purchase;
    await nextAccountRead;

    expect(purchases.logIn).toHaveBeenCalledWith(USER_B);
    expect(mockActiveUserId).toBe(USER_B);
  });

  it('rejects a missing API key in release configuration', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = '';
    (global as any).__DEV__ = false;

    await expect(billing.getMonthlyPackage(USER_A)).rejects.toMatchObject({
      code: 'billing_unavailable',
    });
    expect(purchases.configure).not.toHaveBeenCalled();
  });

  it('rejects test API keys in release configuration', async () => {
    (global as any).__DEV__ = false;

    await expect(billing.getMonthlyPackage(USER_A)).rejects.toMatchObject({
      code: 'billing_unavailable',
    });
    expect(purchases.configure).not.toHaveBeenCalled();
  });

  it.each([
    ['a different product', 'com.coalfocks.homedoc.pro.annual', 'P1M'],
    ['a non-monthly period', MONTHLY_SKU, 'P1Y'],
  ])('fails closed for %s', async (_description, productId, period) => {
    mockMonthlyPackage.product.identifier = productId;
    mockMonthlyPackage.product.subscriptionPeriod = period;

    await expect(billing.getMonthlyPackage(USER_A)).rejects.toMatchObject({
      code: 'monthly_plan_unavailable',
    });
  });

  it('uses the configured SKU from Expo or the public environment', async () => {
    process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID =
      'com.coalfocks.homedoc.pro.custom-monthly';
    mockMonthlyPackage.product.identifier =
      'com.coalfocks.homedoc.pro.custom-monthly';

    await expect(billing.getMonthlyPackage(USER_A)).resolves.toBe(
      mockMonthlyPackage,
    );

    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID;
    constants.expoConfig.extra.appStoreProProductId =
      'com.coalfocks.homedoc.pro.expo-monthly';
    mockMonthlyPackage.product.identifier =
      'com.coalfocks.homedoc.pro.expo-monthly';
    await expect(billing.getMonthlyPackage(USER_A)).resolves.toBe(
      mockMonthlyPackage,
    );
  });

  it('reports purchase cancellation distinctly', async () => {
    purchases.purchasePackage.mockRejectedValue({ code: '1' });

    await expect(billing.purchaseMonthly(USER_A)).rejects.toMatchObject({
      code: 'purchase_cancelled',
      message: 'Purchase cancelled.',
    });
  });

  it('ignores a non-Apple management URL and opens Apple subscriptions', async () => {
    purchases.getCustomerInfo.mockResolvedValue({
      managementURL: 'https://example.com/account/subscriptions',
    });

    await billing.manageSubscriptions(USER_A);

    expect(linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/account/subscriptions',
    );
  });

  it('uses only a safe Apple management URL', async () => {
    purchases.getCustomerInfo.mockResolvedValue({
      managementURL: 'https://apps.apple.com/account/subscriptions?foo=bar',
    });

    await billing.manageSubscriptions(USER_A);

    expect(linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/account/subscriptions?foo=bar',
    );
  });

  it('keeps the fallback independent of RevenueCat and rejects billing off iOS', async () => {
    const fallback = require('../nativeBilling');

    await expect(fallback.getMonthlyPackage(USER_A)).rejects.toMatchObject({
      code: 'billing_unavailable',
    });
    await expect(fallback.purchaseMonthly(USER_A)).rejects.toMatchObject({
      code: 'billing_unavailable',
    });
  });
});
