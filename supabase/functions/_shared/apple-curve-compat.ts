import crypto from 'node:crypto';

const curveAliases: Record<string, string> = {
  p256: 'prime256v1',
  p384: 'secp384r1',
  p521: 'secp521r1',
};

/**
 * Normalize Deno's short NIST curve labels to Node's canonical labels for
 * jsonwebtoken's key-type checks. Key material and crypto operations stay native.
 */
export function installAppleCurveCompat(probeEcDer: Uint8Array): boolean {
  const probeKey = new crypto.X509Certificate(probeEcDer).publicKey;
  if (probeKey.asymmetricKeyType !== 'ec') {
    throw new Error(
      'Apple curve compatibility probe must be an EC certificate.',
    );
  }

  let keyPrototype = Object.getPrototypeOf(probeKey);
  let descriptor: PropertyDescriptor | undefined;
  while (keyPrototype && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(
      keyPrototype,
      'asymmetricKeyDetails',
    );
    if (!descriptor) keyPrototype = Object.getPrototypeOf(keyPrototype);
  }
  if (!keyPrototype || !descriptor?.get) {
    throw new Error('EC key curve metadata getter is unavailable.');
  }

  const details = descriptor.get.call(probeKey) as
    | { namedCurve?: string; [key: string]: unknown }
    | undefined;
  if (!details?.namedCurve || !curveAliases[details.namedCurve]) return false;
  if (!descriptor.configurable) {
    throw new Error('EC key curve metadata getter cannot be normalized.');
  }

  Object.defineProperty(keyPrototype, 'asymmetricKeyDetails', {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get() {
      const nativeDetails = descriptor.get!.call(this) as
        | { namedCurve?: string; [key: string]: unknown }
        | undefined;
      if (this.asymmetricKeyType !== 'ec' || !nativeDetails?.namedCurve) {
        return nativeDetails;
      }
      const namedCurve = curveAliases[nativeDetails.namedCurve];
      return namedCurve ? { ...nativeDetails, namedCurve } : nativeDetails;
    },
  });
  return true;
}
