/* eslint-env jest */
import { toGraphId } from '../helpers/id-helper';
import { zone1 } from '../test/db.mock';
import { createTestContext } from '../test/helpers';

const ctx = createTestContext();

beforeEach(async () => {
  await ctx.db.uniconfigZone.create({
    data: zone1,
  });
});

// TODO: needed to handle kafka service client mockup for this test to be doable
it.skip('ensures that device can be created', async () => {
  const zoneId = toGraphId('Zone', zone1.id);
  const deviceResult = await ctx.client.request(`
    mutation {
      addDevice(input: {
        name: "test device",
        zoneId: "${zoneId}",
      }) {
        device {
          name
          zone {
            id
            name
          }
        }
      }
    }
  `);

  expect(deviceResult).toMatchInlineSnapshot(`
Object {
  "addDevice": Object {
    "device": Object {
      "name": "test device",
      "zone": Object {
        "id": "Wm9uZTplYzZlNmU3Ny00M2VjLTQ3ZmItYjY4YS0xMGViMTE0OWQwOTA",
        "name": "zone1",
      },
    },
  },
}
`);
});
