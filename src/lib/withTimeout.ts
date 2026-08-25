export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label}_TIMEOUT`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
