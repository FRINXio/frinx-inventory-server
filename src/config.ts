function envString(key: string): string {
  const { env } = process;
  const value = env[key];
  if (typeof value !== 'string') {
    throw new Error(`Mandatory env variable "${key}" not found`);
  }

  return value;
}

function optionalEnvString(key: string): string | null {
  const { env } = process;
  const value = env[key];
  return value || null;
}

type TopologyConfig = {
  topologyEnabled: boolean;
  arangoURL?: string;
  arangoUser?: string;
  arangoPassword?: string;
  arangoDb?: string;
};

// all arango params must be present or none
function getTopologyConfig(): TopologyConfig {
  const host = optionalEnvString('ARANGO_URL');
  const user = optionalEnvString('ARANGO_USER');
  const password = optionalEnvString('ARANGO_PASSWORD');
  const db = optionalEnvString('ARANGO_DB');
  if (!host && !user && !password && !db) {
    return {
      topologyEnabled: false,
    };
  }

  if (!host || !user || !password || !db) {
    throw new Error(`Not all mandatory topology env variables were found.`);
  }

  return {
    topologyEnabled: true,
    arangoURL: host,
    arangoUser: user,
    arangoPassword: password,
    arangoDb: db,
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
