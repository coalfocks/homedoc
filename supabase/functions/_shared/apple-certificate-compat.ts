import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import type { KeyObject } from 'node:crypto';
import { ASN1HEX, X509 } from 'npm:jsrsasign@11.1.5';

// Hosted Edge runtimes can lack X509Certificate raw/toString/verify. Apple
// also constructs OCSP responder certificates, so every certificate must work.
// https://github.com/supabase/edge-runtime/issues/750
//
// Preserve the original DER/PEM. If native certificate.verify is unavailable,
// parse its signed bytes with Apple's existing ASN.1 dependency and use native
// crypto.verify with an exact algorithm/parameter allowlist. Apple's chain,
// identity, CA/OID, dates and online revocation checks remain unchanged.
const signatureAlgorithms: Record<string, { hash: string; keyType: string }> = {
  '300a06082a8648ce3d040302': { hash: 'sha256', keyType: 'ec' },
  '300a06082a8648ce3d040303': { hash: 'sha384', keyType: 'ec' },
  '300d06092a864886f70d01010b0500': { hash: 'sha256', keyType: 'rsa' },
  '300d06092a864886f70d01010c0500': { hash: 'sha384', keyType: 'rsa' },
};

function verifyCertificateDer(der: Buffer, issuerKey: KeyObject) {
  const hex = der.toString('hex');
  const tbsIndex = ASN1HEX.getChildIdx(hex, 0)[0];
  const tbsChildren = ASN1HEX.getChildIdx(hex, tbsIndex);
  const versionPresent = hex.slice(tbsChildren[0], tbsChildren[0] + 2) === 'a0';
  const innerAlgorithm = ASN1HEX.getTLV(
    hex,
    tbsChildren[versionPresent ? 2 : 1],
  );
  const outerAlgorithm = ASN1HEX.getTLVbyList(hex, 0, [1], '30');
  const algorithm = outerAlgorithm ? signatureAlgorithms[outerAlgorithm] : null;
  const signatureBits = ASN1HEX.getVbyList(hex, 0, [2], '03');
  if (
    !algorithm ||
    !signatureBits ||
    innerAlgorithm !== outerAlgorithm ||
    !signatureBits.startsWith('00') ||
    signatureBits.length <= 2
  ) {
    throw new Error('Unsupported Apple certificate signature parameters.');
  }
  // Apple's verifier tries each trusted root; an issuer of another key type is
  // simply a non-match, just like native X509Certificate.verify.
  if (issuerKey.asymmetricKeyType !== algorithm.keyType) return false;
  return crypto.verify(
    algorithm.hash,
    Buffer.from(ASN1HEX.getTLV(hex, tbsIndex), 'hex'),
    issuerKey,
    Buffer.from(signatureBits.slice(2), 'hex'),
  );
}
export function installAppleCertificateCompat(probeDer: Buffer) {
  const NativeCertificate = crypto.X509Certificate;
  try {
    const probe = new NativeCertificate(probeDer);
    probe.raw;
    probe.toString();
    probe.verify(probe.publicKey);
    probe.infoAccess;
    return false;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (error as Error & { code?: string }).code !== 'ERR_NOT_IMPLEMENTED'
    ) {
      throw error;
    }
  }

  class EncodedCertificate extends NativeCertificate {
    private readonly originalDer: Buffer;

    constructor(input: ConstructorParameters<typeof NativeCertificate>[0]) {
      super(input);
      // Apple's pinned library constructs X509Certificate only from DER Buffer
      // values. Fail closed if a future library introduces a different format.
      if (!Buffer.isBuffer(input)) {
        throw new Error('Apple certificate must use DER Buffer encoding.');
      }
      this.originalDer = Buffer.from(input);
      Object.defineProperty(this, 'raw', {
        get: () => Buffer.from(this.originalDer),
        configurable: false,
      });
      Object.defineProperty(this, 'infoAccess', {
        get: () => {
          try {
            return Reflect.get(NativeCertificate.prototype, 'infoAccess', this);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              (error as Error & { code?: string }).code !==
                'ERR_NOT_IMPLEMENTED' ||
              !error.message.includes(
                'crypto.X509Certificate.prototype.infoAccess',
              )
            ) {
              throw error;
            }
            const cert = new X509();
            cert.readCertHex(this.originalDer.toString('hex'));
            const access = cert.getExtAIAInfo();
            if (!access) return undefined;
            const lines = [
              ...access.ocsp.map((uri: string) => `OCSP - URI:${uri}`),
              ...access.caissuer.map(
                (uri: string) => `CA Issuers - URI:${uri}`,
              ),
            ];
            if (lines.some((line) => /[\r\n\0]/.test(line))) {
              throw new Error('Invalid Apple certificate authority URL.');
            }
            return lines.join('\n') || undefined;
          }
        },
        configurable: false,
      });
    }

    override toString(): string {
      const lines = this.originalDer.toString('base64').match(/.{1,64}/g);
      if (!lines) throw new Error('Invalid Apple certificate encoding.');
      return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
    }

    override verify(issuerKey: KeyObject): boolean {
      try {
        return super.verify(issuerKey);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (error as Error & { code?: string }).code !== 'ERR_NOT_IMPLEMENTED' ||
          !error.message.includes('crypto.X509Certificate.prototype.verify')
        ) {
          throw error;
        }
        return verifyCertificateDer(this.originalDer, issuerKey);
      }
    }
  }

  // The pinned Apple CommonJS module reads crypto.X509Certificate at each
  // construction (including OCSP); this request isolate has no other consumers.
  Object.defineProperty(crypto, 'X509Certificate', {
    value: EncodedCertificate,
    writable: false,
    configurable: false,
  });
  return true;
}
