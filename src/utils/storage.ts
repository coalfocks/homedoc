import { supabase } from '../lib/supabase';

export const uploadImage = async (file: File | Blob, path: string): Promise<string> => {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteImage = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('images')
    .remove([path]);

  if (error) {
    throw error;
  }
};

export const getImageUrl = (path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(path);

  return publicUrl;
}; 