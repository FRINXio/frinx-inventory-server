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

## Enviroment variables

Example values are stored in `.env.example` in the root of the repository. These are required values:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/frinx"
UNICONFIG_API_PROTOCOL=http
UNICONFIG_API_PORT=8181
UNICONFIG_LIST_URL=http://10.19.0.7/static/list/uniconfig
```
