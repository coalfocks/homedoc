import { supabase } from '../lib/supabase';

const DIRECT_URI_PATTERN = /^(https?:|file:|content:|data:|blob:)/i;
const LOCAL_UPLOAD_URI_PATTERN = /^(file:|content:|data:|blob:)/i;

export const isDirectImageUri = (value: string | null | undefined) =>
  Boolean(value && DIRECT_URI_PATTERN.test(value));

export const isLocalUploadImageUri = (value: string | null | undefined) =>
  Boolean(value && LOCAL_UPLOAD_URI_PATTERN.test(value));

export const uploadPrivateImage = async (
  uri: string,
  pathPrefix: string,
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const path = `${pathPrefix}/${fileName}`;

  const { error } = await supabase.storage.from('images').upload(path, blob);

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
