import { extendType, list, nonNull } from 'nexus';
import config from '../config';
import { Workflow } from './source-types';

type DescriptionJSON = { labels?: string[]; description: string };

const jsonParse = <T = { description: string }>(json?: string | null): T | null => {
  if (json == null) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const getLabels = (workflows: Omit<Workflow, 'id'>[]): string[] => {
  const labelsSet = new Set<string>();

  workflows.forEach((w) => {
    const descriptionJSON = jsonParse<DescriptionJSON>(w.description ?? '');
    if (!descriptionJSON) {
      return;
    }
    const { labels } = descriptionJSON;
    labels?.forEach((l) => labelsSet.add(l));
  });
  return [...labelsSet].sort();
};

export const WorkflowsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('workflowLabels', {
      type: list(nonNull('String')),
      resolve: async (_, _args, { conductorAPI }) => {
        const workflows = await conductorAPI.getWorkflowMetadata(config.conductorApiURL);
        const labels = getLabels(workflows);
        return labels;
      },
    });
  },
});
