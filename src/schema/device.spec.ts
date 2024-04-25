/* eslint-env jest */
import { zone1 } from '../test/db.mock';
import { createTestContext } from '../test/helpers';

const ctx = createTestContext();

beforeEach(async () => {
  await ctx.db.uniconfigZone.create({
    data: zone1,
  });
});

// TODO: needed to handle kafka service client mockup for this test to be doable
// TODO: commented test because when using it.skip function nexusjs and jest then return this specific error ->
// ReferenceError: You are trying to `import` a file after the Jest environment has been torn down. - TypeError: prettier.resolveConfig is not a function
it('ensures that device can be created', async () => {
  // const zoneId = toGraphId('Zone', zone1.id);
  // const deviceResult = await ctx.client.request(`
  //   mutation {
  //     addDevice(input: {
  //       name: "test device",
  //       zoneId: "${zoneId}",
  //     }) {
  //       device {
  //         name
  //         zone {
  //           id
  //           name
  //         }
  //       }
  //     }
  //   }
  // `);
  // expect(deviceResult).toMatchInlineSnapshot(`
  //   Object {
  //     "addDevice": Object {
  //       "device": Object {
  //         "name": "test device",
  //         "zone": Object {
  //           "id": "Wm9uZTplYzZlNmU3Ny00M2VjLTQ3ZmItYjY4YS0xMGViMTE0OWQwOTA",
  //           "name": "zone1",
  //         },
  //       },
  //     },
  //   }
  // `);
});
