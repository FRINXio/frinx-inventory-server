import { decodeWorkflowTaskInput, NestedTask } from '../external-api/conductor-network-types';

export function validateTasks(tasks: string): NestedTask[] {
  try {
    const json = JSON.parse(tasks);
    const output = decodeWorkflowTaskInput(json);
    return output;
  } catch (e) {
    throw new Error('tasks validation error');
  }
}
