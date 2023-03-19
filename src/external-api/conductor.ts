import { decodeWorkflowMetadataOutput, WorfklowMetadataOutput } from './conductor-network-types';
import { sendGetRequest } from './helpers';

async function getWorkflowMetadata(baseURL: string): Promise<WorfklowMetadataOutput> {
  const json = await sendGetRequest([baseURL, 'metadata/workflow']);
  const data = decodeWorkflowMetadataOutput(json);
  return data;
}

const conductorAPI = {
  getWorkflowMetadata,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
