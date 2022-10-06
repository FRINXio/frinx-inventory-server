# FRINX Inventory server

## Dependencies

- PostgreSQL database running
  - you can run `docker compose up` locally
- access to the running instance of FRINX Machine (KrakenD & UniConfig)

## Running development version

```bash
$ docker compose up
$ yarn run prisma:generate
$ yarn run dev
```

`docker compose up` will initialize a database along with some sample development data. Run `docker compose down` to start fresh.

### Arango

`.jwt-secret` was generated using this command:

```bash
$ docker exec <container-id> arangodb auth token --auth.jwt-secret=mysecret/.jwt-secret
```

`.jwt-token` is signed token that we got using:

```bash
$ docker exec <container-id> arangodb auth token --auth.jwt-secret=my-secret/.jwt-secret
```

## Enviroment variables

Example values are stored in `.env.example` in the root of the repository. These are required values:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/frinx"
UNICONFIG_API_PROTOCOL=http
UNICONFIG_API_PORT=8181
UNICONFIG_LIST_URL=http://10.19.0.7/static/list/uniconfig
X_TENANT_ID="frinx"
```

## Seed data

### Development

To seed arango data:

```bash
$ yarn arango:seed
```

To seed postgre data:

```bash
$ yarn prisma:seed
```

### Production

Both script are compiled and included in running docker. So you can connect to running docker and run the script inside:

```bash
$ docker exec -it <inventory-container-id> sh
$ node arango/init.js
$ node prisma/seed.js
```

Or you can run it directly using:

```bash
$ docker exec <inventory-container-id> node arango/init.js
$ docker exec <inventory-container-id> node prisma/seed.js

```
