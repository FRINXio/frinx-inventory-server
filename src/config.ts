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

type ArangoConfigEnabled = {
  topologyEnabled: true;
  arangoURL: string;
  arangoUser: string;
  arangoPassword: string;
  arangoDb: string;
  arangoToken: string | null;
  topologyDiscoveryURL: string | null;
};

type ArangoConfigDisabled = {
  topologyEnabled: false;
};

type ArangoConfig = ArangoConfigDisabled | ArangoConfigEnabled;

// all arango params must be present or none
function getTopologyConfig(): ArangoConfig {
  const host = optionalEnvString('ARANGO_URL');
  const user = optionalEnvString('ARANGO_USER');
  const password = optionalEnvString('ARANGO_PASSWORD');
  const token = optionalEnvString('ARANGO_TOKEN');
  const db = optionalEnvString('ARANGO_DB');
  const topologyEnabled = stringToBoolean(envString('TOPOLOGY_ENABLED'));
  const topologyDiscoveryURL = optionalEnvString('TOPOLOGY_DISCOVERY_API_URL');
  if (!topologyEnabled) {
    return {
      topologyEnabled: false,
    };
  }

  if (!host || !user || !password || !db) {
    throw new Error(`Not all mandatory arango env variables were found.`);
  }

  if (!topologyDiscoveryURL) {
    throw new Error('Not all mandatory topology discovery url were found.');
  }

  return {
    topologyEnabled: true,
    topologyDiscoveryURL,
    arangoURL: host,
    arangoUser: user,
    arangoPassword: password,
    arangoDb: db,
    arangoToken: token,
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
  ...getTopologyConfig(),
};

export default config;
