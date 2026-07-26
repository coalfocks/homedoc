import { imageUriToUploadPayload } from './privateImages';

jest.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('imageUriToUploadPayload', () => {
  it('converts base64 data image URIs to uploadable bytes', async () => {
    const payload = await imageUriToUploadPayload(
      'data:image/jpeg;base64,aGVsbG8=',
    );

    expect(payload.contentType).toBe('image/jpeg');
    expect(Array.from(new Uint8Array(payload.body))).toEqual([
      104, 101, 108, 108, 111,
    ]);
  });

  it('defaults data image URIs without a MIME type to JPEG', async () => {
    const payload = await imageUriToUploadPayload('data:;base64,aGVsbG8=');

    expect(payload.contentType).toBe('image/jpeg');
    expect(payload.body.byteLength).toBe(5);
  });

  it('rejects invalid base64 data image URIs', async () => {
    await expect(
      imageUriToUploadPayload('data:image/jpeg;base64,not image data!'),
    ).rejects.toThrow('valid base64');
  });
});
