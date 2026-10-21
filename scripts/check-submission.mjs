import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const { expo } = await readJson('../app.json');
const listing = await readJson('../docs/app-store/en-US.json');
const subscriptions = await readJson('../docs/app-store/subscriptions.json');
const pkg = await readJson('../package.json');
const storeKitModule = await readJson(
  '../modules/homedoc-storekit/expo-module.config.json',
);
assert.equal(subscriptions.billingProvider, 'apple_storekit_2');
assert.equal(pkg.dependencies['react-native-purchases'], undefined);
assert.ok(storeKitModule.apple.modules.includes('HomeDocStoreKitModule'));
assert.equal(subscriptions.currency, 'USD');
assert.equal(subscriptions.defaultInterval, 'annual');
assert.equal(subscriptions.entitlement, 'pro');
assert.deepEqual(
  subscriptions.products.map(({ interval, productId, period, price }) => ({
    interval,
    productId,
    period,
    price,
  })),
  [
    {
      interval: 'annual',
      productId: 'com.coalfocks.homedoc.pro.annual',
      period: 'P1Y',
      price: 14.99,
    },
    {
      interval: 'monthly',
      productId: 'com.coalfocks.homedoc.pro.monthly',
      period: 'P1M',
      price: 2.99,
    },
  ],
  'Release product setup must match the approved monthly and yearly options.',
);
assert.equal(subscriptions.access.basicRecordsFree, true);
assert.equal(subscriptions.access.freeOwnedHomes, 1);
assert.equal(subscriptions.access.freeAiRequestsPerMonth, 4);
assert.equal(subscriptions.access.proAiRequestsPerMonth, 50);
for (const product of subscriptions.products) {
  assert.ok(product.displayName.length <= 30);
  assert.ok(product.description.length <= 55);
}
for (const [field, limit] of Object.entries({
  name: 30,
  subtitle: 30,
  promo: 170,
  description: 4000,
  keywords: 100,
})) {
  assert.equal(typeof listing[field], 'string', `Missing listing ${field}`);
  assert.ok(
    listing[field].length > 0 && Buffer.byteLength(listing[field]) <= limit,
    `${field} exceeds ${limit} bytes`,
  );
  assert.ok(
    !/TODO|TBD|PLACEHOLDER/.test(listing[field]),
    `${field} has unfinished copy`,
  );
}
assert.equal(expo.ios.bundleIdentifier, 'com.coalfocks.homedoc');
assert.match(expo.version, /^\d+\.\d+\.\d+$/);
assert.match(expo.ios.buildNumber, /^\d{12,14}$/);
assert.equal(expo.ios.infoPlist.ITSAppUsesNonExemptEncryption, false);
const paidBuild =
  process.env.EAS_BUILD_PROFILE === 'app-store' ||
  process.argv.includes('--paid');
if (paidBuild) {
  assert.equal(
    process.env.EXPO_PUBLIC_HOMEDOC_FREE_BETA,
    'false',
    'Paid builds must disable the global beta bypass. Existing beta access comes from the server.',
  );
}
console.log(
  `Submission metadata passed${paidBuild ? '; paid build configuration passed' : ''}. Native purchase/device QA and Apple account setup remain separate release gates.`,
);
