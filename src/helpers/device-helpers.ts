type FilterInput = {
  labelIds?: string[] | null;
  deviceName?: string | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
  name?: Record<string, unknown>;
};

type OrderingInput = {
  sortKey: 'name' | 'createdAt' | 'serviceState';
  direction: 'ASC' | 'DESC';
};

function getLabelsQuery(labelIds: string[]): Record<string, unknown> | undefined {
  return labelIds.length ? { some: { labelId: { in: labelIds } } } : undefined;
}

function getDeviceNameQuery(deviceName?: string | null): Record<string, unknown> | undefined {
  return deviceName ? { contains: deviceName, mode: 'insensitive' } : undefined;
}

export function getFilterQuery(filter?: FilterInput | null): FilterQuery | undefined {
  if (!filter) {
    return undefined;
  }
  const { labelIds, deviceName } = filter;
  return {
    label: getLabelsQuery(labelIds ?? []),
    name: getDeviceNameQuery(deviceName),
  };
}

export function getOrderingQuery(ordering?: OrderingInput | null): Record<string, unknown> | undefined {
  return ordering
    ? {
        orderBy: [{ [ordering.sortKey]: ordering.direction.toLowerCase() }],
      }
    : undefined;
}
