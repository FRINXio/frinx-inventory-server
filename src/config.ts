function envString(key: string): string {
  const { env } = process;
  const value = env[key];
  if (typeof value !== 'string') {
    throw new Error(`Mandatory env variable "${key}" not found`);
  }

  return value;
}

function stringToBoolean(value: string): boolean {
  switch (value.toLowerCase()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
    case '':
    default:
      return false;
  }
}

function optionalEnvString(key: string): string | null {
  const { env } = process;
  const value = env[key];
  return value || null;
}

type TopologyConfigEnabled = {
  topologyEnabled: true;
  topologyDiscoveryURL: string;
  topologyDiscoveryGraphqlURL: string;
};

type TopologyConfigDisabled = {
  topologyEnabled: false;
};

type TopologyConfig = TopologyConfigDisabled | TopologyConfigEnabled;

// all arango params must be present or none
function getTopologyConfig(): TopologyConfig {
  const topologyEnabled = stringToBoolean(envString('TOPOLOGY_ENABLED'));
  const topologyDiscoveryURL = optionalEnvString('TOPOLOGY_DISCOVERY_API_URL');
  const topologyDiscoveryGraphqlURL = optionalEnvString('TOPOLOGY_DISCOVERY_GRAPHQL_API_URL');
  if (!topologyEnabled) {
    return {
      topologyEnabled: false,
    };
  }

  if (!topologyDiscoveryURL || !topologyDiscoveryGraphqlURL) {
    throw new Error(
      'Not all mandatory topology discovery url (TOPOLOGY_DISCOVERY_API_URL, TOPOLOGY_DISCOVERY_GRAPHQL_API_URL) were found.',
    );
  }

  return {
    topologyEnabled: true,
    topologyDiscoveryURL,
    topologyDiscoveryGraphqlURL,
  };
}

const config = {
  host: envString('HOST'),
  port: envString('PORT'),
  dbURL: envString('DATABASE_URL'),
  uniconfigApiProtocol: envString('UNICONFIG_API_PROTOCOL'),
  uniconfigApiPort: envString('UNICONFIG_API_PORT'),
  uniconfigListURL: envString('UNICONFIG_LIST_URL'),
  defaultTenantId: envString('X_TENANT_ID'),
  shellHost: envString('SHELL_HOST'),
  ...getTopologyConfig(),
};

export default config;
