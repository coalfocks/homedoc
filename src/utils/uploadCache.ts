// Keep successful uploads for this form's lifetime. If another photo or the
// record save fails, retry only the failed work instead of uploading every photo.
export const createUploadCache = (
  upload: (uri: string, prefix: string) => Promise<string>,
) => {
  const uploads = new Map<string, Promise<string>>();
  return (uri: string, prefix: string): Promise<string> => {
    const key = JSON.stringify([prefix, uri]);
    const existing = uploads.get(key);
    if (existing) return existing;
    const pending = upload(uri, prefix).catch((error) => {
      uploads.delete(key);
      throw error;
    });
    uploads.set(key, pending);
    return pending;
  };
};
