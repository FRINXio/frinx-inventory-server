import { fromGraphId } from './id-helper';

type FilterInput = {
  labelIds?: string[] | null;
  deviceName?: string | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
  name?: Record<string, unknown>;
};
type OrderingInput = {
  sortKey: 'NAME' | 'CREATED_AT';
  direction: 'ASC' | 'DESC';
};

function getLabelsQuery(labelIds: string[]): Record<string, unknown> | undefined {
  return labelIds.length ? { some: { labelId: { in: labelIds } } } : undefined;
}
function getDeviceNameQuery(deviceName?: string | null): Record<string, unknown> | undefined {
  return deviceName ? { startsWith: deviceName } : undefined;
}
export function getFilterQuery(filter?: FilterInput | null): FilterQuery | undefined {
  if (!filter) {
    return undefined;
  }
  const { labelIds, deviceName } = filter;
  const nativeLabelIds = (labelIds ?? []).map((lId) => fromGraphId('Label', lId));
  return {
    label: getLabelsQuery(nativeLabelIds),
    name: getDeviceNameQuery(deviceName),
  };
}
export function getOrderingQuery(ordering?: OrderingInput | null): Record<string, unknown> | undefined {
  return ordering
    ? {
        orderBy: [{ [ordering.sortKey === 'NAME' ? 'name' : 'createdAt']: ordering.direction.toLowerCase() }],
      }
    : undefined;
}
