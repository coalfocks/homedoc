import { imagePickerAssetToUri } from './imagePickerAssets';

describe('imagePickerAssetToUri', () => {
  it('prefers JPEG data URIs when base64 image data is available', () => {
    expect(
      imagePickerAssetToUri({
        uri: 'file:///tmp/original.heic',
        width: 100,
        height: 100,
        base64: 'abc123',
        mimeType: 'image/jpeg',
      }),
    ).toBe('data:image/jpeg;base64,abc123');
  });

  it('falls back to the local asset URI when base64 data is unavailable', () => {
    expect(
      imagePickerAssetToUri({
        uri: 'file:///tmp/original.jpg',
        width: 100,
        height: 100,
      }),
    ).toBe('file:///tmp/original.jpg');
  });

  it('uses JPEG as the default data URI MIME type', () => {
    expect(
      imagePickerAssetToUri({
        uri: 'file:///tmp/original',
        width: 100,
        height: 100,
        base64: 'abc123',
      }),
    ).toBe('data:image/jpeg;base64,abc123');
  });
});
