import base64url from 'base64url';

export type DataType =
  | 'Zone'
  | 'Device'
  | 'Workflow'
  | 'ExecutedWorkflow'
  | 'ExecutedWorkflowTask'
  | 'Label'
  | 'Location'
  | 'Country'
  | 'Blueprint'
  | 'GraphNode'
  | 'GraphEdge'
  | 'Schedule'
  | 'Pool'
  | 'PollData'
  | 'EventHandler'
  | 'EventHandlerAction'
  | 'TaskDefinition';

function isDataType(value: string): value is DataType {
  return (
    value === 'Zone' ||
    value === 'Device' ||
    value === 'Workflow' ||
    value === 'ExecutedWorkflow' ||
    value === 'ExecutedWorkflowTask' ||
    value === 'Label' ||
    value === 'Location' ||
    value === 'Country' ||
    value === 'Blueprint' ||
    value === 'GraphNode' ||
    value === 'GraphEdge' ||
    value === 'Schedule' ||
    value === 'TaskDefinition' ||
    value === 'Pool' ||
    value === 'PollData' ||
    value === 'EventHandler' ||
    value === 'EventHandlerAction'
  );
}

function unwrapType(type: string): DataType {
  if (isDataType(type)) {
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
