import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import ts from 'typescript';

const source = await readFile(
  new URL(
    '../supabase/functions/_shared/apple-curve-compat.ts',
    import.meta.url,
  ),
  'utf8',
);
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), 'homedoc-apple-curves-'),
);

function openssl(...args) {
  execFileSync('openssl', args, { stdio: 'ignore' });
}

async function createEcFixture(name, curve) {
  const keyPath = path.join(temporaryDirectory, `${name}.key`);
  const certPath = path.join(temporaryDirectory, `${name}.pem`);
  const derPath = path.join(temporaryDirectory, `${name}.der`);
  openssl(
    'genpkey',
    '-algorithm',
    'EC',
    '-pkeyopt',
    `ec_paramgen_curve:${curve}`,
    '-out',
    keyPath,
  );
  openssl(
    'req',
    '-new',
    '-x509',
    '-key',
    keyPath,
    '-sha256',
    '-days',
    '2',
    '-subj',
    `/CN=${name}`,
    '-out',
    certPath,
  );
  openssl('x509', '-in', certPath, '-outform', 'DER', '-out', derPath);
  const privateKey = crypto.createPrivateKey(await readFile(keyPath));
  const certificate = new crypto.X509Certificate(await readFile(derPath));
  return {
    der: await readFile(derPath),
    privateKey,
    publicKey: certificate.publicKey,
  };
}

function loadInstaller() {
  const exports = {};
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const wrapped = `(function(exports, require, module) { ${compiled}\n})`;
  const runModule = vm.runInThisContext(wrapped, {
    filename: 'apple-curve-compat.ts',
  });
  const module = { exports };
  runModule(
    exports,
    (specifier) => {
      if (specifier === 'node:crypto') return crypto;
      throw new Error(`Unexpected import: ${specifier}`);
    },
    module,
  );
  return module.exports.installAppleCurveCompat;
}

function findKeyDetailsPrototype(key) {
  let prototype = Object.getPrototypeOf(key);
  while (
    prototype &&
    !Object.getOwnPropertyDescriptor(prototype, 'asymmetricKeyDetails')
  ) {
    prototype = Object.getPrototypeOf(prototype);
  }
  return prototype;
}

try {
  const p256 = await createEcFixture('P256-Curve-Test', 'prime256v1');
  const p384 = await createEcFixture('P384-Curve-Test', 'secp384r1');
  const p521 = await createEcFixture('P521-Curve-Test', 'secp521r1');

  const keyPrototype = findKeyDetailsPrototype(p256.publicKey);
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    keyPrototype,
    'asymmetricKeyDetails',
  );
  assert.equal(typeof originalDescriptor?.get, 'function');

  // Node already exposes canonical names, so compatibility installation is a
  // no-op and the original prototype getter remains intact.
  const installNative = loadInstaller();
  assert.equal(installNative(p256.der), false);
  assert.equal(
    Object.getOwnPropertyDescriptor(keyPrototype, 'asymmetricKeyDetails').get,
    originalDescriptor.get,
  );

  // Emulate Deno's abbreviated metadata while keeping all KeyObject values and
  // signing/verification operations native.
  const aliases = {
    prime256v1: 'p256',
    secp384r1: 'p384',
    secp521r1: 'p521',
  };
  Object.defineProperty(keyPrototype, 'asymmetricKeyDetails', {
    ...originalDescriptor,
    get() {
      const details = originalDescriptor.get.call(this);
      const namedCurve = details?.namedCurve;
      return aliases[namedCurve]
        ? { ...details, namedCurve: aliases[namedCurve] }
        : details;
    },
  });

  try {
    assert.equal(p256.publicKey.asymmetricKeyDetails.namedCurve, 'p256');
    assert.equal(p384.privateKey.asymmetricKeyDetails.namedCurve, 'p384');
    assert.equal(p521.publicKey.asymmetricKeyDetails.namedCurve, 'p521');

    const installCompat = loadInstaller();
    assert.equal(installCompat(p256.der), true);
    assert.equal(p256.publicKey.asymmetricKeyDetails.namedCurve, 'prime256v1');
    assert.equal(p384.publicKey.asymmetricKeyDetails.namedCurve, 'secp384r1');
    assert.equal(p521.privateKey.asymmetricKeyDetails.namedCurve, 'secp521r1');

    const token256 = jwt.sign({ purpose: 'test' }, p256.privateKey, {
      algorithm: 'ES256',
    });
    assert.deepEqual(
      jwt.verify(token256, p256.publicKey, { algorithms: ['ES256'] }),
      { purpose: 'test', iat: jwt.decode(token256).iat },
    );
    assert.throws(
      () =>
        jwt.sign({ purpose: 'test' }, p384.privateKey, { algorithm: 'ES256' }),
      /ES256|curve|prime256v1/i,
      'ES256 signing must still reject a P-384 private key',
    );
    assert.throws(
      () => jwt.verify(token256, p384.publicKey, { algorithms: ['ES256'] }),
      /ES256|curve|prime256v1/i,
      'ES256 verification must still reject a P-384 public key',
    );

    const token384 = jwt.sign({ purpose: 'test' }, p384.privateKey, {
      algorithm: 'ES384',
    });
    jwt.verify(token384, p384.publicKey, { algorithms: ['ES384'] });
    assert.throws(
      () => jwt.verify(token384, p256.publicKey, { algorithms: ['ES384'] }),
      /ES384|curve|secp384r1/i,
      'ES384 verification must still reject a P-256 public key',
    );

    const token512 = jwt.sign({ purpose: 'test' }, p521.privateKey, {
      algorithm: 'ES512',
    });
    jwt.verify(token512, p521.publicKey, { algorithms: ['ES512'] });
    assert.throws(
      () => jwt.verify(token512, p384.publicKey, { algorithms: ['ES512'] }),
      /ES512|curve|secp521r1/i,
      'ES512 verification must still reject a P-384 public key',
    );
  } finally {
    Object.defineProperty(
      keyPrototype,
      'asymmetricKeyDetails',
      originalDescriptor,
    );
  }

  // Native metadata getter failures are not treated as curve aliases.
  const throwingPrototype = Object.getPrototypeOf(p256.publicKey);
  Object.defineProperty(throwingPrototype, 'asymmetricKeyDetails', {
    ...originalDescriptor,
    get() {
      throw new Error('Unexpected native metadata failure');
    },
  });
  try {
    assert.throws(
      () => loadInstaller()(p256.der),
      /Unexpected native metadata failure/,
    );
  } finally {
    Object.defineProperty(
      throwingPrototype,
      'asymmetricKeyDetails',
      originalDescriptor,
    );
  }

  console.log('Apple curve compatibility tests passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
