import { restoreSession } from './sessionStartup';

describe('session restoration', () => {
  afterEach(() => jest.useRealTimers());

  it('restores an existing session and permits a signed-out startup', async () => {
    const session = { user: { id: 'tester' } };
    await expect(
      restoreSession(async () => ({ data: { session }, error: null })),
    ).resolves.toBe(session);
    await expect(
      restoreSession(async () => ({ data: { session: null }, error: null })),
    ).resolves.toBeNull();
  });

  it('surfaces returned auth errors and rejected storage reads', async () => {
    const failure = new Error('unavailable');
    await expect(
      restoreSession(async () => ({ data: { session: null }, error: failure })),
    ).rejects.toBe(failure);
    await expect(restoreSession(() => Promise.reject(failure))).rejects.toBe(
      failure,
    );
  });

  it('times out a stalled read so the UI can offer retry', async () => {
    jest.useFakeTimers();
    const result = restoreSession(() => new Promise(() => {}), 50);
    const assertion = expect(result).rejects.toThrow('timed out');
    jest.advanceTimersByTime(50);
    await assertion;
    expect(jest.getTimerCount()).toBe(0);
  });
});
