import { Prisma, PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import jsonParse from 'json-templates';
import { CSVParserToPromise, CSVValuesToJSON, isHeaderValid, JSONDevice } from '../src/helpers/import-csv.helpers';
import unwrap from '../src/helpers/unwrap';

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
      "node-extension:reconcile": false,
      "uniconfig-config:install-uniconfig-node-enabled": true
  }
}

`;

const prisma = new PrismaClient();

async function getDeviceList(): Promise<JSONDevice[]> {
  const stream = createReadStream(`${__dirname}/../sample.csv`);
  const parser = stream.pipe(parse());
  const [header, ...records] = await CSVParserToPromise(parser);
  if (!isHeaderValid(header)) {
    throw new Error('Incorrect CSV values.');
  }
  return CSVValuesToJSON(records);
}

async function getCreateDevicesArgs(): Promise<Prisma.deviceCreateManyArgs> {
  const uniconfigZoneId = await prisma.uniconfigZone.findFirst();
  const deviceList = await getDeviceList();
  const blueprints = await prisma.blueprint.findMany();
  const data = deviceList.map((device) => {
    const { node_id, device_type, version, port_number } = device;
    const matchingBlueprint = blueprints.find((bp) => bp.name === `${device_type}_${version}_${port_number}`);
    const trimmedTemplate = matchingBlueprint?.template.trim() ?? '{}';
    const parsedTemplate = jsonParse(trimmedTemplate);
    return {
      name: node_id,
      tenantId: 'frinx',
      uniconfigZoneId: unwrap(uniconfigZoneId).id,
      mountParameters: JSON.stringify(JSON.parse(parsedTemplate(device))),
      source: 'IMPORTED' as const,
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

async function importBlueprints() {
  return await prisma.blueprint.createMany({
    data: [
      {
        tenantId: 'frinx',
        name: 'ios xr_5.3.*_22',
        template: SAMPLE_BLUEPRINT_TEMPLATE,
      },
    ],
    skipDuplicates: true,
  });
}

async function importUniconfigZone() {
  return await prisma.uniconfigZone.create({
    data: {
      name: 'localhost',
      tenantId: 'frinx',
    },
  });
}

async function main() {
  const uniconfigZone = await importUniconfigZone();
  const blueprints = await importBlueprints();
  const devices = await importDevices();
  return {
    uniconfigZone,
    blueprints,
    devices,
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
