# FRINX Inventory server

## Dependencies

- PostgreSQL database running
  - you can run `docker compose up` locally
- access to the running instance of FRINX Machine (KrakenD & UniConfig)

## Running development version

```bash
$ docker compose up
$ yarn prisma migrate dev
$ yarn run prisma:generate
$ yarn prisma:seed && yarn arango:seed
$ yarn run dev
```

`docker compose up` will initialize a database along with some sample development data. Run `docker compose down` to start fresh.

`yarn prisma migrate dev` is optional and will migrate postgresql database when you are starting from scratch.

`yarn prisma:seed && yarn arango:seed` these commands are optional. Use them when you want to use the topology service, else they are not needed.

### Troubleshoot

If you have problem to seed postgres DB `yarn prisma:seed`, try to delete all records from the database.

`yarn prisma studio` this command will execute GUI for DB in your browser, then delete all records the DB has and then run `yarn prisma:seed` again.

## Enviroment variables

Example values are stored in `.env.example` in the root of the repository. These are required values:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/frinx"
UNICONFIG_API_PROTOCOL=http
UNICONFIG_API_PORT=8181
UNICONFIG_LIST_URL=http://10.19.0.7/static/list/uniconfig
X_TENANT_ID="frinx"
```
