import { blueprint, device, label, location, uniconfigZone } from '@prisma/client';
import {
  ApiExecutedWorkflow,
  ApiExecutedWorkflowTask,
  ApiWorkflow,
  NestedTask,
  ApiTaskDefinition,
} from '../external-api/conductor-network-types';
import { GetScheduleQuery } from '../__generated__/graphql';

export type Label = label;
export type Device = device;
export type Zone = uniconfigZone;
export type Location = location;
export type DataStore = {
  $deviceName: string;
  $uniconfigURL: string;
  $transactionId: string;
};
export type Country = {
  id: string;
  name: string;
  code: string;
};
export type Blueprint = blueprint;
export type Workflow = ApiWorkflow & { id: string };
export type ExecutedWorkflow = ApiExecutedWorkflow & { id: string };
export type ExecutedWorkflowTask = ApiExecutedWorkflowTask & { id: string };
export type WorkflowTask = NestedTask;
export type TaskDefinition = ApiTaskDefinition;
export type Schedule = GetScheduleQuery['schedule'] & { id: string };
