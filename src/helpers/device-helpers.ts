import { Prisma } from '@prisma/client';
import { MetadataOutput } from './device-types';

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
type Position = {
  x: number;
  y: number;
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
  return {
    label: getLabelsQuery(labelIds ?? []),
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

export function updateMetadataWithPosition(
  metadata: MetadataOutput | null,
  position: Position,
): Prisma.InputJsonObject {
  return {
    ...metadata,
    position,
  };
}
