import { join } from 'path';
import { makeSchema } from 'nexus';
import * as globalTypes from './global-types';
import * as device from './device';
import * as zone from './zone';
import * as dataStore from './data-store';
import * as label from './label';
import * as location from './location';

export default makeSchema({
  contextType: {
    module: require.resolve('../context'),
    export: 'Context',
  },
  outputs: {
    typegen: join(__dirname, 'nexus-typegen.ts'),
    schema: join(__dirname, './api.graphql'),
  },
  shouldExitAfterGenerateArtifacts: Boolean(process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION),
  types: [globalTypes, device, zone, dataStore, label, location],
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
