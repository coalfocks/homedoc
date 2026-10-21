import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const { expo } = await readJson('../app.json');
const listing = await readJson('../docs/app-store/en-US.json');
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
  assert.match(
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
    /^appl_[A-Za-z0-9]+$/,
    'Configure the RevenueCat Apple public SDK key before building. Never use a secret or Test Store key in the app.',
  );
}
console.log(
  `Submission metadata passed${paidBuild ? '; paid build configuration passed' : ''}. Native purchase/device QA and Apple account setup remain separate release gates.`,
);
