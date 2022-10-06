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
  arangoEnabled: true;
  arangoURL: string;
  arangoUser: string;
  arangoPassword: string;
  arangoDb: string;
  arangoToken: string | null;
};

type ArangoConfigDisabled = {
  arangoEnabled: false;
};

type ArangoConfig = ArangoConfigDisabled | ArangoConfigEnabled;

// all arango params must be present or none
function getArangoConfig(): ArangoConfig {
  const host = optionalEnvString('ARANGO_URL');
  const user = optionalEnvString('ARANGO_USER');
  const password = optionalEnvString('ARANGO_PASSWORD');
  const token = optionalEnvString('ARANGO_TOKEN');
  const db = optionalEnvString('ARANGO_DB');
  const arangoEnabled = stringToBoolean(envString('ARANGO_ENABLED'));
  if (!arangoEnabled) {
    return {
      arangoEnabled: false,
    };
  }

  if (!host || !user || !password || !db) {
    throw new Error(`Not all mandatory arango env variables were found.`);
  }

  return {
    arangoEnabled: true,
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
  ...getArangoConfig(),
};

export default config;
