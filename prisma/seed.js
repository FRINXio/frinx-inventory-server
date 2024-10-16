'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const csv_parse_1 = require('csv-parse');
const fs_1 = require('fs');
const json_templates_1 = __importDefault(require('json-templates'));
const import_csv_helpers_1 = require('../helpers/import-csv.helpers');
const utils_helpers_1 = require('../helpers/utils.helpers');
const DEFAULT_UNICONFIG_ZONE = 'localhost';
const { X_TENANT_ID } = process.env;
if (!X_TENANT_ID) {
  throw new Error('Please set all mandatory .env variables');
}
const tenantId = X_TENANT_ID;
const SAMPLE_BLUEPRINT_TEMPLATE = `
{
  "cli": {
      "cli-topology:host" : "{{ip_address}}",
      "cli-topology:port" : {{port_number}},
      "cli-topology:transport-type": "ssh",
      "cli-topology:device-type": "{{device_type}}",
      "cli-topology:device-version": "{{version}}",
      "cli-topology:username": "{{user}}",
      "cli-topology:password": "{{password}}",
      "cli-topology:journal-size": 150,
      "cli-topology:dry-run-journal-size": 150,
      "cli:topology:parsing-engine" : "tree-parser",
      "uniconfig-config:install-uniconfig-node-enabled": true
  }
}`;
const STREAM_PARAMETERS = {
  'subscriptions:stream': [
    {
      'stream-name': 'GNMI',
      mode: 'TARGET_DEFINED',
      paths: ['state/system/cpu=1/summary/usage', 'state/system/memory-pools/summary'],
    },
  ],
};
// TODO: we are setting uniconfig zone based on optional -z flag when running seed script
// example: `npm run prisma:seed -z uniconfig`
// when flag is omitted, localhost is used
// we should maybe look for other alternative how to fill uniconfig zone automatically
function getUniconfigZone() {
  const zoneFlagIndex = process.argv.indexOf('-z');
  if (zoneFlagIndex === -1) {
    return DEFAULT_UNICONFIG_ZONE;
  }
  const zoneFlagValue = process.argv[zoneFlagIndex + 1];
  return zoneFlagValue || DEFAULT_UNICONFIG_ZONE;
}
const prisma = new client_1.PrismaClient();
async function getDeviceList() {
  const stream = (0, fs_1.createReadStream)(`${__dirname}/../sample.csv`);
  const parser = stream.pipe((0, csv_parse_1.parse)());
  const [header, ...records] = await (0, import_csv_helpers_1.CSVParserToPromise)(parser);
  if (!(0, import_csv_helpers_1.isHeaderValid)(header)) {
    throw new Error('Incorrect CSV values.');
  }
  return (0, import_csv_helpers_1.CSVValuesToJSON)(records);
}
async function getCreateDevicesArgs() {
  const uniconfigZoneId = await prisma.uniconfigZone.findFirst();
  const deviceList = await getDeviceList();
  const blueprints = await prisma.blueprint.findMany();
  const data = deviceList.map((device) => {
    const { node_id, device_type, version, port_number, ip_address } = device;
    const matchingBlueprint = blueprints.find((bp) => bp.name === `${device_type}_${version}_${port_number}`);
    const trimmedTemplate = matchingBlueprint?.template.trim() ?? '{}';
    const parsedTemplate = (0, json_templates_1.default)(trimmedTemplate);
    return {
      name: node_id,
      tenantId,
      uniconfigZoneId: (0, utils_helpers_1.unwrap)(uniconfigZoneId).id,
      managementIp: ip_address,
      port: port_number,
      software: device_type,
      version,
      mountParameters: JSON.parse(parsedTemplate(device)),
      source: 'IMPORTED',
    };
  });
  return {
    data,
    skipDuplicates: true,
  };
}
async function importDevices() {
  const args = await getCreateDevicesArgs();
  const devices = await prisma.device.createMany(args);
  return devices;
}
async function importStreams() {
  const devices = await getDeviceList();
  const data = devices.map((d) => ({
    deviceName: d.node_id,
    streamName: 'sample_stream',
    streamParameters: STREAM_PARAMETERS,
    tenantId,
  }));
  const createArgs = {
    data,
    skipDuplicates: true,
  };
  return await prisma.stream.createMany(createArgs);
}
async function importBlueprints() {
  return await prisma.blueprint.createMany({
    data: [
      {
        tenantId,
        name: 'ios xr_5.3.*_22',
        template: SAMPLE_BLUEPRINT_TEMPLATE,
      },
    ],
    skipDuplicates: true,
  });
}
async function importUniconfigZone(uniconfigZone) {
  await prisma.uniconfigZone.deleteMany({ where: {} });
  return await prisma.uniconfigZone.create({
    data: {
      name: uniconfigZone,
      tenantId,
    },
  });
}
async function main() {
  const uniconfigZoneArg = getUniconfigZone();
  // first delete all streams, because of foreign key contraint check
  await prisma.stream.deleteMany();
  const uniconfigZone = await importUniconfigZone(uniconfigZoneArg);
  const blueprints = await importBlueprints();
  const devices = await importDevices();
  const streams = await importStreams();
  return {
    uniconfigZone,
    blueprints,
    devices,
    streams,
  };
}
main()
  .then((data) => {
    console.log(`Seed successfull`, data);
  })
  .catch((e) => {
    console.log(`Error occured:`, e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
