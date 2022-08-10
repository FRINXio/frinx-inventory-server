import { Source, Prisma, PrismaClient, blueprint } from '@prisma/client';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import jsonParse from 'json-templates';
import { isHeaderValid, CSVParserToPromise, CSVValuesToJSON, JSONDevice } from '../src/helpers/import-csv.helpers';
import unwrap from '../src/helpers/unwrap';

const SAMPLE_BLUEPRINT_TEMPLATE = `{
"node_id": "{{node_id}}",
"ip_address":"{{ip_address}}",
"port_number":{{port_number}},
"device_type":"{{device_type}}",
"version":{{version}},
"user":"{{user}}",
"password":"{{password}}"
}`;

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
    console.log(uniconfigZoneId);
    return {
      name: node_id,
      tenantId: 'frinx',
      uniconfigZoneId: unwrap(uniconfigZoneId).id,
      mountParameters: JSON.stringify(JSON.parse(parsedTemplate(device))),
      source: 'IMPORTED' as Source,
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
        name: 'foo_2_22',
        template: SAMPLE_BLUEPRINT_TEMPLATE,
      },
      {
        tenantId: 'frinx',
        name: 'baz_2_22',
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
