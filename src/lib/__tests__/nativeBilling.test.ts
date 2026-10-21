let mockMonthlyProduct: Record<string, any>;
let mockAnnualProduct: Record<string, any>;
let mockStoreKit: Record<string, jest.Mock>;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn(async () => undefined) },
}));

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn(() => mockStoreKit),
}));

const USER_A = '0a9c9c15-4da4-414e-a6a7-693b0633da11';
const USER_B = 'a0b9c9ea-0797-4bb8-b86f-bddf4ff23aab';
const MONTHLY_SKU = 'com.coalfocks.homedoc.pro.monthly';
const ANNUAL_SKU = 'com.coalfocks.homedoc.pro.annual';

function validMonthlyProduct() {
  return {
    productId: MONTHLY_SKU,
    title: 'HomeDoc Pro',
    description: 'Monthly subscription',
    price: 2.99,
    priceString: '$2.99',
    currencyCode: 'USD',
    subscriptionPeriod: 'P1M',
    isAutoRenewable: true,
  };
}

function validAnnualProduct() {
  return {
    productId: ANNUAL_SKU,
    title: 'HomeDoc Pro',
    description: 'Annual subscription',
    price: 14.99,
    priceString: '$14.99',
    currencyCode: 'USD',
    subscriptionPeriod: 'P1Y',
    isAutoRenewable: true,
  };
}

describe('native StoreKit billing adapter', () => {
  let billing: typeof import('../nativeBilling.ios');
  let constants: any;
  let linking: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID;
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID;
    mockMonthlyProduct = validMonthlyProduct();
    mockAnnualProduct = validAnnualProduct();
    mockStoreKit = {
      getProducts: jest.fn(async () => [mockMonthlyProduct, mockAnnualProduct]),
      purchase: jest.fn(async (productId) => ({
        status: 'purchased',
        transactionId: '9000000000000001',
        productId,
      })),
      getCurrentEntitlements: jest.fn(async () => []),
      restorePurchases: jest.fn(async () => []),
      finishTransaction: jest.fn(async () => true),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    };

    billing = require('../nativeBilling.ios');
    constants = require('expo-constants').default;
    linking = require('react-native').Linking;
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID;
    delete process.env.EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID;
  });

  it('returns both current products with localized prices and ISO periods', async () => {
    const result = await billing.getBillingPackages(USER_A);

    expect(result.monthly.product.priceString).toBe('$2.99');
    expect(result.monthly.product.subscriptionPeriod).toBe('P1M');
    expect(result.annual.product.priceString).toBe('$14.99');
    expect(result.annual.product.subscriptionPeriod).toBe('P1Y');
    expect(mockStoreKit.getProducts).toHaveBeenCalledWith([
      MONTHLY_SKU,
      ANNUAL_SKU,
    ]);
  });

  it('serializes operations and passes each account token to StoreKit', async () => {
    let finishPurchase!: (result: unknown) => void;
    mockStoreKit.purchase.mockImplementation(
      (productId: string, appAccountToken: string) =>
        new Promise((resolve) => {
          expect(productId).toBe(MONTHLY_SKU);
          expect(appAccountToken).toBe(USER_A);
          finishPurchase = resolve;
        }),
    );

    const purchase = billing.purchaseBillingPackage(USER_A, 'monthly');
    while (!finishPurchase) await Promise.resolve();
    const nextAccountRead = billing.getCurrentEntitlementTransactionIDs(USER_B);

    expect(mockStoreKit.getCurrentEntitlements).not.toHaveBeenCalled();
    finishPurchase({
      status: 'purchased',
      transactionId: '9000000000000001',
      productId: MONTHLY_SKU,
    });
    await purchase;
    await nextAccountRead;

    expect(mockStoreKit.getCurrentEntitlements).toHaveBeenCalledWith(USER_B, [
      MONTHLY_SKU,
      ANNUAL_SKU,
    ]);
  });

  it.each([
    ['monthly', 'wrong product', ANNUAL_SKU, 'P1M', true],
    ['monthly', 'wrong period', MONTHLY_SKU, 'P1Y', true],
    ['monthly', 'non-renewable product', MONTHLY_SKU, 'P1M', false],
    ['annual', 'wrong product', MONTHLY_SKU, 'P1Y', true],
    ['annual', 'wrong period', ANNUAL_SKU, 'P1M', true],
    ['annual', 'non-renewable product', ANNUAL_SKU, 'P1Y', false],
  ] as const)(
    'fails closed for %s with %s',
    async (interval, _description, productId, period, isAutoRenewable) => {
      const product =
        interval === 'monthly' ? mockMonthlyProduct : mockAnnualProduct;
      product.productId = productId;
      product.subscriptionPeriod = period;
      product.isAutoRenewable = isAutoRenewable;

      await expect(billing.getBillingPackages(USER_A)).rejects.toMatchObject({
        code:
          interval === 'monthly'
            ? 'monthly_plan_unavailable'
            : 'annual_plan_unavailable',
      });
    },
  );

  it('uses configured product IDs from public environment variables', async () => {
    process.env.EXPO_PUBLIC_APP_STORE_PRO_PRODUCT_ID =
      'com.coalfocks.homedoc.pro.custom-monthly';
    process.env.EXPO_PUBLIC_APP_STORE_PRO_ANNUAL_PRODUCT_ID =
      'com.coalfocks.homedoc.pro.custom-annual';
    mockMonthlyProduct.productId = 'com.coalfocks.homedoc.pro.custom-monthly';
    mockAnnualProduct.productId = 'com.coalfocks.homedoc.pro.custom-annual';

    await expect(billing.getBillingPackages(USER_A)).resolves.toMatchObject({
      monthly: { product: { identifier: mockMonthlyProduct.productId } },
      annual: { product: { identifier: mockAnnualProduct.productId } },
    });
  });

  it('uses configured Expo product IDs when public environment variables are absent', async () => {
    constants.expoConfig.extra.appStoreProProductId =
      'com.coalfocks.homedoc.pro.expo-monthly';
    constants.expoConfig.extra.appStoreProAnnualProductId =
      'com.coalfocks.homedoc.pro.expo-annual';
    mockMonthlyProduct.productId = 'com.coalfocks.homedoc.pro.expo-monthly';
    mockAnnualProduct.productId = 'com.coalfocks.homedoc.pro.expo-annual';

    await expect(billing.getBillingPackages(USER_A)).resolves.toMatchObject({
      monthly: { product: { identifier: mockMonthlyProduct.productId } },
      annual: { product: { identifier: mockAnnualProduct.productId } },
    });
  });

  it.each([
    ['annual', ANNUAL_SKU],
    ['monthly', MONTHLY_SKU],
  ] as const)(
    'purchases selected %s product with account token',
    async (interval, sku) => {
      await expect(
        billing.purchaseBillingPackage(USER_A, interval),
      ).resolves.toBe('9000000000000001');
      expect(mockStoreKit.purchase).toHaveBeenCalledWith(sku, USER_A);
    },
  );

  it('reports cancellation and pending approval distinctly', async () => {
    mockStoreKit.purchase.mockResolvedValueOnce({ status: 'cancelled' });
    await expect(
      billing.purchaseBillingPackage(USER_A, 'annual'),
    ).rejects.toMatchObject({ code: 'purchase_cancelled' });

    mockStoreKit.purchase.mockResolvedValueOnce({ status: 'pending' });
    await expect(
      billing.purchaseBillingPackage(USER_A, 'annual'),
    ).rejects.toMatchObject({ code: 'purchase_pending' });
  });

  it('rejects a transaction for a different product or malformed transaction ID', async () => {
    mockStoreKit.purchase.mockResolvedValueOnce({
      status: 'purchased',
      transactionId: '9000000000000001',
      productId: MONTHLY_SKU,
    });
    await expect(
      billing.purchaseBillingPackage(USER_A, 'annual'),
    ).rejects.toMatchObject({ code: 'purchase_failed' });

    mockStoreKit.purchase.mockResolvedValueOnce({
      status: 'purchased',
      transactionId: 'bad-id',
      productId: ANNUAL_SKU,
    });
    await expect(
      billing.purchaseBillingPackage(USER_A, 'annual'),
    ).rejects.toMatchObject({ code: 'purchase_failed' });
  });

  it('returns only native current-entitlement transaction IDs for this account token', async () => {
    mockStoreKit.getCurrentEntitlements.mockResolvedValue(['9000000000000001']);

    await expect(
      billing.getCurrentEntitlementTransactionIDs(USER_A),
    ).resolves.toEqual(['9000000000000001']);
    expect(mockStoreKit.getCurrentEntitlements).toHaveBeenCalledWith(USER_A, [
      MONTHLY_SKU,
      ANNUAL_SKU,
    ]);
  });

  it('forwards only verified native updates for this account and known SKUs without finishing them', () => {
    let onUpdate!: (update: unknown) => void;
    const remove = jest.fn();
    mockStoreKit.addListener.mockImplementation((_name, listener) => {
      onUpdate = listener;
      return { remove };
    });
    const onTransaction = jest.fn();
    const subscription = billing.subscribeToTransactionUpdates(
      USER_A,
      onTransaction,
    );

    onUpdate({
      transactionId: '9000000000000001',
      productId: MONTHLY_SKU,
      appAccountToken: USER_B,
    });
    onUpdate({
      transactionId: '9000000000000001',
      productId: 'unknown.product',
      appAccountToken: USER_A,
    });
    onUpdate({
      transactionId: 'not-numeric',
      productId: ANNUAL_SKU,
      appAccountToken: USER_A,
    });
    onUpdate(null);
    onUpdate({
      transactionId: '9000000000000002',
      productId: ANNUAL_SKU,
      appAccountToken: USER_A.toUpperCase(),
    });

    expect(onTransaction).toHaveBeenCalledTimes(1);
    expect(onTransaction).toHaveBeenCalledWith('9000000000000002');
    expect(mockStoreKit.finishTransaction).not.toHaveBeenCalled();
    subscription.remove();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(mockStoreKit.addListener).toHaveBeenCalledWith(
      'onTransactionUpdate',
      expect.any(Function),
    );
  });

  it('rejects transaction update subscriptions for invalid account IDs', () => {
    expect(() =>
      billing.subscribeToTransactionUpdates('not-a-uuid', jest.fn()),
    ).toThrow();
    expect(mockStoreKit.addListener).not.toHaveBeenCalled();
  });

  it('restores and returns native transaction IDs for the matching account token', async () => {
    mockStoreKit.restorePurchases.mockResolvedValue(['9000000000000002']);

    await expect(billing.restorePurchases(USER_A)).resolves.toEqual([
      '9000000000000002',
    ]);
    expect(mockStoreKit.restorePurchases).toHaveBeenCalledWith(USER_A, [
      MONTHLY_SKU,
      ANNUAL_SKU,
    ]);
  });

  it('finishes a transaction only when requested by the verified server flow', async () => {
    await billing.finishTransaction('9000000000000001');
    expect(mockStoreKit.finishTransaction).toHaveBeenCalledWith(
      '9000000000000001',
    );

    await expect(billing.finishTransaction('invalid')).rejects.toMatchObject({
      code: 'transaction_finish_failed',
    });
  });

  it('opens only Apple subscription management', async () => {
    await billing.manageSubscriptions(USER_A);

    expect(linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/account/subscriptions',
    );
  });

  it('keeps the platform fallback independent of StoreKit', async () => {
    const fallback = require('../nativeBilling');

    await expect(fallback.getBillingPackages(USER_A)).rejects.toMatchObject({
      code: 'billing_unavailable',
    });
    await expect(
      fallback.purchaseBillingPackage(USER_A, 'monthly'),
    ).rejects.toMatchObject({ code: 'billing_unavailable' });
  });
});
