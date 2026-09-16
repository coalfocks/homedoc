import { createUploadCache } from './uploadCache';

it('reuses successful and in-flight photos when another upload fails', async () => {
  const upload = jest
    .fn()
    .mockResolvedValueOnce('saved/one.jpg')
    .mockRejectedValueOnce(new Error('connection lost'))
    .mockResolvedValueOnce('saved/two.jpg');
  const cached = createUploadCache(upload);
  const first = cached('data:one', 'notes/area/0');
  expect(cached('data:one', 'notes/area/0')).toBe(first);
  await expect(
    Promise.all([first, cached('data:two', 'notes/area/1')]),
  ).rejects.toThrow('connection lost');
  await expect(
    Promise.all([
      cached('data:one', 'notes/area/0'),
      cached('data:two', 'notes/area/1'),
    ]),
  ).resolves.toEqual(['saved/one.jpg', 'saved/two.jpg']);
  expect(upload).toHaveBeenCalledTimes(3);
});

it('does not reuse an upload across different records or changed images', async () => {
  const upload = jest.fn().mockResolvedValue('saved/image.jpg');
  const cached = createUploadCache(upload);
  await cached('data:one', 'areas/first');
  await cached('data:one', 'areas/second');
  await cached('data:changed', 'areas/first');
  expect(upload).toHaveBeenCalledTimes(3);
});
