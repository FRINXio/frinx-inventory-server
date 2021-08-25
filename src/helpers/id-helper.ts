import base64url from 'base64url';

export type DataType = 'Zone' | 'Device' | 'Label' | 'Location' | 'Country';

function unwrapType(type: string): DataType {
  if (type === 'Zone' || type === 'Device' || type === 'Label' || type === 'Location' || type === 'Country') {
    return type;
  }
  throw new Error(`graphId: invalid type-name: ${type}`);
}

export function toGraphId(type: DataType, nativeId: string): string {
  return base64url.encode(`${type}:${nativeId}`);
}

const ID_STRING_RE = /^([^:]+):(.+)$/;

function getIdAndType(idString: string): { type: DataType; nativeId: string } {
  const match = ID_STRING_RE.exec(base64url.decode(idString));

  if (!match) {
    throw new Error(`getIdAndType: invalid id-string: ${idString}`);
  }

  const type = unwrapType(match[1]);
  const nativeId = match[2];

  return { type, nativeId };
}

export function fromGraphId(type: DataType, idString: string): string {
  const data = getIdAndType(idString);

  if (data.type !== type) {
    throw new Error(`fromGraphId: id ${idString} is not for type ${type}`);
  }

  return data.nativeId;
}

export function getType(idString: string): DataType {
  const data = getIdAndType(idString);
  return data.type;
}
