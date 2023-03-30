import { extendType, list, nonNull } from 'nexus';
import config from '../config';
import { jsonParse } from '../helpers/workflow.helpers';
import { Workflow } from './source-types';

type DescriptionJSON = { labels?: string[]; description: string };

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
