import { supabase } from '../lib/supabase';

const DIRECT_URI_PATTERN = /^(https?:|file:|content:|data:|blob:)/i;
const LOCAL_UPLOAD_URI_PATTERN = /^(file:|content:|data:|blob:)/i;
const DATA_URI_PATTERN = /^data:([^;,]+)?(;base64)?,(.*)$/i;
const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const isDirectImageUri = (value: string | null | undefined) =>
  Boolean(value && DIRECT_URI_PATTERN.test(value));

export const isLocalUploadImageUri = (value: string | null | undefined) =>
  Boolean(value && LOCAL_UPLOAD_URI_PATTERN.test(value));

type ImageUploadPayload = {
  body: ArrayBuffer;
  contentType: string;
};

const copyBytesToArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const decodeBase64ToBytes = (input: string): Uint8Array => {
  const cleanInput = input.replace(/\s/g, '').replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of cleanInput) {
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error('Selected image data is not valid base64.');
    }

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
};

export const imageUriToUploadPayload = async (
  uri: string,
): Promise<ImageUploadPayload> => {
  const dataUriMatch = DATA_URI_PATTERN.exec(uri);

  if (dataUriMatch) {
    const [, mimeType, base64Marker, encodedData] = dataUriMatch;
    const bytes = base64Marker
      ? decodeBase64ToBytes(encodedData)
      : new Uint8Array(
          decodeURIComponent(encodedData)
            .split('')
            .map((char) => char.charCodeAt(0)),
        );

    return {
      body: copyBytesToArrayBuffer(bytes),
      contentType: mimeType?.startsWith('image/') ? mimeType : 'image/jpeg',
    };
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read selected image (${response.status}).`);
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'image/jpeg',
  };
};

export const uploadPrivateImage = async (
  uri: string,
  pathPrefix: string,
): Promise<string> => {
  const { body, contentType } = await imageUriToUploadPayload(uri);

  if (body.byteLength === 0) {
    throw new Error('Selected image was empty and could not be uploaded.');
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const path = `${pathPrefix}/${fileName}`;

  const { error } = await supabase.storage.from('images').upload(path, body, {
    contentType,
  });

  if (error) throw error;

  return path;
};

export const resolveImageUri = async (
  value: string | null | undefined,
): Promise<string | null> => {
  if (!value) return null;
  if (isDirectImageUri(value)) return value;

  const { data, error } = await supabase.storage
    .from('images')
    .createSignedUrl(value, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
};
