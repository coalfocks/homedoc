import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import test from 'node:test';
import {
  checkAppleReadiness,
  createAppStoreConnectJwt,
} from './check-apple-readiness.mjs';

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const env = {
  ASC_API_KEY_P8: pem,
  ASC_KEY_ID: 'KEY123',
  ASC_ISSUER_ID: 'issuer-id',
};
const nowMs = 1_800_000_000_000;

test('creates a short-lived verifiable App Store Connect ES256 token', () => {
  const token = createAppStoreConnectJwt({
    ...env,
    privateKey: pem,
    keyId: 'KEY123',
    issuerId: 'issuer-id',
    nowMs,
  });
  const [header, claims, signature] = token.split('.');
  const message = `${header}.${claims}`;
  assert.equal(JSON.parse(Buffer.from(header, 'base64url')).kid, 'KEY123');
  assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url')), {
    iss: 'issuer-id',
    iat: Math.floor(nowMs / 1000),
    exp: Math.floor(nowMs / 1000) + 300,
    aud: 'appstoreconnect-v1',
  });
  assert.equal(
    verify(
      'sha256',
      Buffer.from(message),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'),
    ),
    true,
  );
});

test('reports a verified bundle without exposing authorization material', async () => {
  let authorization;
  const result = await checkAppleReadiness(
    env,
    async (_url, options) => {
      authorization = options.headers.Authorization;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: { attributes: { bundleId: 'com.coalfocks.homedoc' } },
        }),
      };
    },
    nowMs,
  );
  assert.match(authorization, /^Bearer [^.]+\.[^.]+\.[^.]+$/);
  assert.deepEqual(
    {
      ready: result.ready,
      httpStatus: result.httpStatus,
      appleErrorCode: result.appleErrorCode,
      bundleMatches: result.bundleMatches,
    },
    {
      ready: true,
      httpStatus: 200,
      appleErrorCode: null,
      bundleMatches: true,
    },
  );
  assert.equal(JSON.stringify(result).includes(pem), false);
});

test('sanitizes Apple API errors to status and error code only', async () => {
  const result = await checkAppleReadiness(
    env,
    async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        errors: [
          {
            code: 'FORBIDDEN_ERROR',
            detail: 'do not disclose this detail or token',
          },
        ],
      }),
    }),
    nowMs,
  );
  assert.equal(result.ready, false);
  assert.equal(result.httpStatus, 403);
  assert.equal(result.appleErrorCode, 'FORBIDDEN_ERROR');
  assert.equal(JSON.stringify(result).includes('do not disclose'), false);
});

test('fails closed on missing credentials and bundle mismatch', async () => {
  assert.equal(
    (
      await checkAppleReadiness(
        {},
        async () => {
          throw new Error('unexpected');
        },
        nowMs,
      )
    ).appleErrorCode,
    'MISSING_CREDENTIALS',
  );
  const result = await checkAppleReadiness(
    env,
    async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: { attributes: { bundleId: 'wrong.bundle' } },
      }),
    }),
    nowMs,
  );
  assert.equal(result.ready, false);
  assert.equal(result.appleErrorCode, 'BUNDLE_ID_MISMATCH');
});
