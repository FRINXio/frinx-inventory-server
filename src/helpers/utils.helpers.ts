export function unwrap<T>(value: T | null | undefined): T {
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
