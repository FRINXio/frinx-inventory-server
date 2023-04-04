import { extendType, list, nonNull, objectType } from 'nexus';
import config from '../config';

export const TaskDefinition = objectType({
  name: 'TaskDefinition',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.int('timeoutSeconds');
    t.string('createdAt', {
      resolve: (taskDefinition) =>
        taskDefinition.createTime ? new Date(taskDefinition.createTime).toISOString() : new Date().toISOString(),
    });
    t.string('updatedAt', {
      resolve: (taskDefinition) =>
        taskDefinition.updateTime ? new Date(taskDefinition.updateTime).toISOString() : new Date().toISOString(),
    });
    t.string('createdBy');
    t.string('updatedBy');
    t.string('description');
  },
});

export const TaskDefinitionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('taskDefinitions', {
      type: list(nonNull(TaskDefinition)),
      resolve: async (_, _args, { conductorAPI }) => {
        const taskDefinitions = await conductorAPI.getTaskDefinitions(config.conductorApiURL);

        return taskDefinitions;
      },
    });
  },
});
