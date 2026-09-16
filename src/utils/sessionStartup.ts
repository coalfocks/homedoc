/** Bound session restoration so unavailable storage/network cannot trap startup. */
export async function restoreSession<T>(
  load: () => Promise<{ data: { session: T | null }; error: unknown }>,
  timeoutMs = 12000,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load().then(({ data, error }) => {
        if (error) throw error;
        return data.session;
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Session restoration timed out')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
