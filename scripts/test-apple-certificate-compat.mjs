import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import ts from 'typescript';
import jsrsasign from 'jsrsasign';

const moduleSource = await readFile(
  new URL(
    '../supabase/functions/_shared/apple-certificate-compat.ts',
    import.meta.url,
  ),
  'utf8',
);
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), 'homedoc-apple-certificate-'),
);

function openssl(...args) {
  execFileSync('openssl', args, { stdio: 'ignore' });
}

async function createCertificate(name, algorithm, { aia = false } = {}) {
  const keyPath = path.join(temporaryDirectory, `${name}.key`);
  const pemPath = path.join(temporaryDirectory, `${name}.pem`);
  const derPath = path.join(temporaryDirectory, `${name}.der`);
  if (algorithm === 'rsa') {
    openssl(
      'genpkey',
      '-algorithm',
      'RSA',
      '-pkeyopt',
      'rsa_keygen_bits:2048',
      '-out',
      keyPath,
    );
  } else {
    openssl(
      'genpkey',
      '-algorithm',
      'EC',
      '-pkeyopt',
      'ec_paramgen_curve:P-256',
      '-out',
      keyPath,
    );
  }
  const requestArgs = [
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
  ];
  if (aia) {
    requestArgs.push(
      '-addext',
      'authorityInfoAccess=OCSP;URI:http://ocsp.example.test,CA Issuers;URI:http://issuer.example.test',
    );
  }
  requestArgs.push('-out', pemPath);
  openssl(...requestArgs);
  openssl('x509', '-in', pemPath, '-outform', 'DER', '-out', derPath);
  const der = await readFile(derPath);
  const key = crypto.createPublicKey(await readFile(pemPath));
  return { der, key };
}

function loadInstaller({
  failNativeMethods,
  failOnlyVerify = false,
  failInfoAccess = false,
  infoAccessError,
}) {
  class SimulatedEdgeCertificate extends crypto.X509Certificate {
    get raw() {
      if (failNativeMethods) throw notImplemented('raw');
      return super.raw;
    }

    toString() {
      if (failNativeMethods) throw notImplemented('toString');
      return super.toString();
    }

    verify(publicKey) {
      if (failNativeMethods || failOnlyVerify) {
        throw notImplemented(
          'crypto.X509Certificate.prototype.verify is not implemented',
        );
      }
      return super.verify(publicKey);
    }

    get infoAccess() {
      if (failNativeMethods || failInfoAccess) {
        throw notImplemented(
          'crypto.X509Certificate.prototype.infoAccess is not implemented',
        );
      }
      if (infoAccessError) throw infoAccessError;
      return super.infoAccess;
    }
  }

  const cryptoShim = Object.create(crypto);
  Object.defineProperty(cryptoShim, 'X509Certificate', {
    value: SimulatedEdgeCertificate,
    configurable: true,
    writable: true,
  });
  // Preserve the real Node crypto.verify function as the runtime primitive the
  // Edge fallback is expected to call.
  cryptoShim.verify = crypto.verify.bind(crypto);

  const exports = {};
  const compiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const wrapped = `(function(exports, require, module) { ${compiled}\n})`;
  const runModule = vm.runInThisContext(wrapped, {
    filename: 'apple-certificate-compat.ts',
  });
  const module = { exports };
  runModule(
    exports,
    (specifier) => {
      if (specifier === 'node:buffer') return { Buffer };
      if (specifier === 'node:crypto') return cryptoShim;
      if (specifier.startsWith('npm:jsrsasign')) return jsrsasign;
      throw new Error(`Unexpected import: ${specifier}`);
    },
    module,
  );
  return {
    installer: module.exports.installAppleCertificateCompat,
    cryptoShim,
  };
}

function notImplemented(method) {
  return Object.assign(
    new Error(`${method} is not implemented in simulated Edge`),
    {
      code: 'ERR_NOT_IMPLEMENTED',
    },
  );
}

function assertFallbackVerification({ installer, cryptoShim }, der, issuerKey) {
  const patched = installer(Buffer.from(der));
  assert.equal(patched, true, 'simulated Edge should activate the fallback');
  const certificate = new cryptoShim.X509Certificate(Buffer.from(der));
  return certificate.verify(issuerKey);
}

try {
  const rsa = await createCertificate('RSA-Apple-Verification-Test', 'rsa');
  const ec = await createCertificate('EC-Apple-Verification-Test', 'ec');
  const withAia = await createCertificate('AIA-Verification-Test', 'rsa', {
    aia: true,
  });
  const wrongIssuer = await createCertificate('Wrong-Issuer-Test', 'rsa');
  const wrongIssuerEc = await createCertificate('Wrong-Issuer-EC-Test', 'ec');

  // Native implementations should stay untouched when all three methods work.
  for (const fixture of [rsa, ec]) {
    const { installer, cryptoShim } = loadInstaller({
      failNativeMethods: false,
    });
    assert.equal(installer(Buffer.from(fixture.der)), false);
    const certificate = new cryptoShim.X509Certificate(fixture.der);
    assert.equal(certificate.verify(fixture.key), true);
  }

  // Simulate the Edge failure on encoding and signature verification methods.
  for (const fixture of [rsa, ec]) {
    const context = loadInstaller({ failNativeMethods: true });
    assert.equal(context.installer(Buffer.from(fixture.der)), true);
    const certificate = new context.cryptoShim.X509Certificate(
      Buffer.from(fixture.der),
    );
    assert.equal(
      certificate.verify(fixture.key),
      true,
      'valid self-signed certificate should verify',
    );
    const sameTypeWrongIssuer =
      fixture === rsa ? wrongIssuer.key : wrongIssuerEc.key;
    assert.equal(
      certificate.verify(sameTypeWrongIssuer),
      false,
      'certificate must fail with an unrelated issuer key',
    );
    let wrongTypeRejected = false;
    try {
      wrongTypeRejected =
        certificate.verify(
          fixture === rsa ? wrongIssuerEc.key : wrongIssuer.key,
        ) === false;
    } catch (error) {
      wrongTypeRejected =
        /Unsupported Apple certificate signature parameters/.test(
          String(error),
        );
    }
    assert.equal(
      wrongTypeRejected,
      true,
      'certificate verification must reject a wrong public-key algorithm',
    );
  }

  // Exercise the case where raw and toString are native but verify alone is
  // missing, so installation is triggered by the verification probe itself.
  const verifyOnlyContext = loadInstaller({
    failNativeMethods: false,
    failOnlyVerify: true,
  });
  assert.equal(verifyOnlyContext.installer(Buffer.from(rsa.der)), true);
  assert.equal(
    new verifyOnlyContext.cryptoShim.X509Certificate(rsa.der).verify(rsa.key),
    true,
  );

  // Native and fallback infoAccess text must agree for OCSP and CA issuer URIs.
  const nativeAiaCertificate = new crypto.X509Certificate(withAia.der);
  const nativeInfoAccess = nativeAiaCertificate.infoAccess;
  assert.equal(
    nativeInfoAccess,
    'OCSP - URI:http://ocsp.example.test\nCA Issuers - URI:http://issuer.example.test',
  );
  const aiaContext = loadInstaller({ failNativeMethods: true });
  assert.equal(aiaContext.installer(withAia.der), true);
  assert.equal(
    new aiaContext.cryptoShim.X509Certificate(withAia.der).infoAccess,
    nativeInfoAccess,
  );

  // No authority information access extension maps to undefined, matching
  // Node's native X509Certificate.infoAccess behavior.
  const noAiaContext = loadInstaller({
    failNativeMethods: true,
    failOnlyVerify: true,
  });
  assert.equal(noAiaContext.installer(rsa.der), true);
  assert.equal(
    new noAiaContext.cryptoShim.X509Certificate(rsa.der).infoAccess,
    undefined,
  );

  // The shim must propagate unrelated native property errors instead of
  // interpreting them as a missing runtime implementation.
  const unrelatedInfoAccessError = new Error(
    'Unexpected native getter failure',
  );
  const getterErrorContext = loadInstaller({
    failNativeMethods: false,
    infoAccessError: unrelatedInfoAccessError,
  });
  assert.throws(
    () => getterErrorContext.installer(rsa.der),
    /Unexpected native getter failure/,
  );

  // Mutating a byte inside the signed TBS changes the signed message while
  // leaving the certificate DER parseable.
  const mutatedTbs = Buffer.from(rsa.der);
  const subjectText = Buffer.from('RSA-Apple-Verification-Test');
  const subjectOffset = mutatedTbs.indexOf(subjectText);
  assert.notEqual(
    subjectOffset,
    -1,
    'generated certificate subject is present',
  );
  mutatedTbs[subjectOffset] ^= 1;
  assert.equal(
    assertFallbackVerification(
      loadInstaller({ failNativeMethods: true }),
      mutatedTbs,
      rsa.key,
    ),
    false,
    'mutated TBS must fail signature verification',
  );

  const mutatedSignature = Buffer.from(rsa.der);
  mutatedSignature[mutatedSignature.length - 1] ^= 1;
  assert.equal(
    assertFallbackVerification(
      loadInstaller({ failNativeMethods: true }),
      mutatedSignature,
      rsa.key,
    ),
    false,
    'mutated signature must fail verification',
  );

  // A same-length change to the outer AlgorithmIdentifier creates an inner /
  // outer mismatch without changing the certificate's DER structure.
  const algorithm = Buffer.from('300d06092a864886f70d01010b0500', 'hex');
  const mismatch = Buffer.from(rsa.der);
  const firstAlgorithm = mismatch.indexOf(algorithm);
  const secondAlgorithm = mismatch.indexOf(algorithm, firstAlgorithm + 1);
  assert.notEqual(firstAlgorithm, -1);
  assert.notEqual(secondAlgorithm, -1);
  mismatch[secondAlgorithm + algorithm.length - 3] = 0x0c;
  assert.throws(
    () =>
      assertFallbackVerification(
        loadInstaller({ failNativeMethods: true }),
        mismatch,
        rsa.key,
      ),
    /Unsupported Apple certificate signature parameters/,
    'mismatched inner and outer signature algorithms must be rejected',
  );

  // Replace both identifiers with a valid but non-whitelisted RSA SHA-512 OID.
  const unsupportedParameters = Buffer.from(rsa.der);
  const algorithmPositions = [firstAlgorithm, secondAlgorithm];
  for (const offset of algorithmPositions) {
    unsupportedParameters[offset + algorithm.length - 3] = 0x0d;
  }
  let unsupportedRejected = false;
  try {
    unsupportedRejected =
      assertFallbackVerification(
        loadInstaller({ failNativeMethods: true }),
        unsupportedParameters,
        rsa.key,
      ) === false;
  } catch {
    unsupportedRejected = true;
  }
  assert.equal(
    unsupportedRejected,
    true,
    'unsupported signature algorithm must fail closed',
  );

  // Changing the NULL parameter tag while preserving the structure and byte
  // length must be rejected by the exact AlgorithmIdentifier allowlist.
  const unsupportedAlgorithmParameters = Buffer.from(rsa.der);
  for (const offset of algorithmPositions) {
    unsupportedAlgorithmParameters[offset + algorithm.length - 2] = 0x06;
  }
  let unsupportedParametersRejected = false;
  try {
    unsupportedParametersRejected =
      assertFallbackVerification(
        loadInstaller({ failNativeMethods: true }),
        unsupportedAlgorithmParameters,
        rsa.key,
      ) === false;
  } catch {
    unsupportedParametersRejected = true;
  }
  assert.equal(
    unsupportedParametersRejected,
    true,
    'unsupported RSA signature parameters must fail closed',
  );

  // Native errors unrelated to the Edge runtime limitation must never trigger
  // a weaker code path.
  const { installer } = loadInstaller({ failNativeMethods: false });
  const malformedProbe = Buffer.from('not a certificate');
  assert.throws(() => installer(malformedProbe));

  console.log(
    'Apple certificate encoding and verification fallback tests passed.',
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
