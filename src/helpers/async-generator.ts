export async function* asyncGenerator<T extends Record<string, unknown>>(
  timeout: number,
  fn: () => Promise<T>,
  repeatTill: () => boolean,
) {
  do {
    // eslint-disable-next-line no-await-in-loop
    const data = await fn();
    yield data;

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  } while (repeatTill());
}
