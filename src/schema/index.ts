import { makeSchema } from 'nexus';
import { join } from 'path';
import * as blueprint from './blueprint';
import * as dataStore from './data-store';
import * as device from './device';
import * as stream from './stream';
import * as globalTypes from './global-types';
import * as label from './label';
import * as location from './location';
import * as zone from './zone';
import * as transaction from './transaction';
import * as topology from './topology';
import * as performanceMonitoring from './performance-monitoring';

export default makeSchema({
  features: {
    abstractTypeStrategies: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __typename: true,
    },
  },
  contextType: {
    module: require.resolve('../context'),
    export: 'Context',
  },
  outputs: {
    typegen: join(__dirname, 'nexus-typegen.ts'),
    schema: join(__dirname, './api.graphql'),
  },
  shouldExitAfterGenerateArtifacts: Boolean(process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION),
  types: [
    globalTypes,
    device,
    stream,
    zone,
    dataStore,
    label,
    location,
    blueprint,
    transaction,
    topology,
    performanceMonitoring,
  ],
  sourceTypes: {
    modules: [
      {
        module: join(__dirname, 'source-types.ts'),
        alias: 'SourceTypes',
      },
    ],
  },
  prettierConfig: join(__dirname, '../../prettier.config.js'),
});
