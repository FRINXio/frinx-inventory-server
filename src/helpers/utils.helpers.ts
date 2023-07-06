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

type ObjectWithoutNullProperties<T> = {
  [K in keyof T]: Exclude<T[K], null> | void;
};

export function makeNullablePropertiesToUndefined<T extends Record<string, unknown>>(
  item: T,
): ObjectWithoutNullProperties<T> {
  const result: ObjectWithoutNullProperties<T> = Object.entries(item).reduce((acc, [key, value]) => {
    if (value == null) {
      return {
        ...acc,
        [key]: undefined,
      };
    }

    return {
      ...acc,
      [key]: value,
    };
  }, Object.create(null));

  if (isValidType('timeoutSeconds', result)) {
    return result;
  } else {
    throw new Error('Invalid type');
  }
}
