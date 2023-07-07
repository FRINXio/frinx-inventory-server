export function unwrap<T>(value: T | null | undefined | void): T {
  if (value == null) {
    throw new Error(`value is of type ${typeof value}`);
  }
  return value;
}

export function omitNullValue<T>(item: T | null | undefined): item is T {
  return !!item;
}

export function omitMaybeType<T>(item: T | null | undefined): T | null {
  if (item == null) {
    return null;
  }
  return item;
}

export function isValidType<T>(key: string, obj: unknown): obj is T {
  if (typeof obj !== 'object' || obj == null) {
    return false;
  }

  return key in obj;
}

export function parseJson<T>(json?: string | null, throwError = true): T {
  try {
    const parsed = JSON.parse(json ?? '');
    return parsed;
  } catch (error) {
    if (throwError) {
      throw new Error('Could not parse JSON');
    } else {
      return {} as T;
    }
  }
}