import type { ImagePickerAsset } from 'expo-image-picker';

export const imagePickerAssetToUri = (asset: ImagePickerAsset): string => {
  if (!asset.base64) return asset.uri;

  const mimeType = asset.mimeType?.startsWith('image/')
    ? asset.mimeType
    : 'image/jpeg';

  return `data:${mimeType};base64,${asset.base64}`;
};

export const imagePickerAssetsToUris = (assets: ImagePickerAsset[]): string[] =>
  assets.map(imagePickerAssetToUri);
