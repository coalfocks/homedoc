import { createPrivateKey, sign } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP_ID = '6779373725';
const BUNDLE_ID = 'com.coalfocks.homedoc';
const API_URL = `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}?fields%5Bapps%5D=bundleId`;

const b64url = (value) => Buffer.from(value).toString('base64url');

export function createAppStoreConnectJwt({
  keyId,
  issuerId,
  privateKey,
  nowMs = Date.now(),
}) {
  const issuedAt = Math.floor(nowMs / 1000);
  const header = b64url(
    JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }),
  );
  const claims = b64url(
    JSON.stringify({
      iss: issuerId,
      iat: issuedAt,
      exp: issuedAt + 300,
      aud: 'appstoreconnect-v1',
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: createPrivateKey(privateKey),
    dsaEncoding: 'ieee-p1363',
  });
  return `${unsigned}.${signature.toString('base64url')}`;
}

const safeAppleCode = (code) =>
  typeof code === 'string' && /^[A-Za-z0-9_.-]{1,80}$/.test(code) ? code : null;

export async function checkAppleReadiness(
  env,
  fetchImpl = fetch,
  nowMs = Date.now(),
) {
  const checkedAt = new Date(nowMs).toISOString();
  if (!env.ASC_API_KEY_P8 || !env.ASC_KEY_ID || !env.ASC_ISSUER_ID) {
    return {
      ready: false,
      httpStatus: null,
      appleErrorCode: 'MISSING_CREDENTIALS',
      bundleMatches: null,
      checkedAt,
    };
  }
  let jwt;
  try {
    jwt = createAppStoreConnectJwt({
      keyId: env.ASC_KEY_ID,
      issuerId: env.ASC_ISSUER_ID,
      privateKey: env.ASC_API_KEY_P8,
      nowMs,
    });
  } catch {
    return {
      ready: false,
      httpStatus: null,
      appleErrorCode: 'INVALID_PRIVATE_KEY',
      bundleMatches: null,
      checkedAt,
    };
  }
  try {
    const response = await fetchImpl(API_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    let body = {};
    try {
      body = await response.json();
    } catch {
      /* status is still useful */
    }
    const appleErrorCode = safeAppleCode(body?.errors?.[0]?.code);
    const bundleMatches = response.ok
      ? body?.data?.attributes?.bundleId === BUNDLE_ID
      : null;
    const ready = response.status === 200 && bundleMatches === true;
    return {
      ready,
      httpStatus: response.status,
      appleErrorCode: ready
        ? null
        : (appleErrorCode ??
          (response.ok ? 'BUNDLE_ID_MISMATCH' : 'APPLE_API_ERROR')),
      bundleMatches,
      checkedAt,
    };
  } catch {
    return {
      ready: false,
      httpStatus: null,
      appleErrorCode: 'NETWORK_ERROR',
      bundleMatches: null,
      checkedAt,
    };
  }
}

async function main() {
  const result = await checkAppleReadiness(process.env);
  await writeFile(
    'apple-readiness.json',
    `${JSON.stringify(result, null, 2)}\n`,
    { mode: 0o600 },
  );
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `ready=${result.ready}\nhttp_status=${result.httpStatus ?? 'none'}\napple_error_code=${result.appleErrorCode ?? 'none'}\n`,
    );
  }
  console.log(
    `App Store Connect readiness: ready=${result.ready}, HTTP ${result.httpStatus ?? 'unavailable'}, Apple code=${result.appleErrorCode ?? 'none'}`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await main();
