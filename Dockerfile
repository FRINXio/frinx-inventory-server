FROM node:18-slim as build

RUN apt-get update
RUN apt-get install -y openssl

RUN mkdir /app

# We need to set production for Node.js
# first we copy things that are needed for yarn-install
COPY . /app/

WORKDIR /app
RUN yarn install --immutable
ENV NODE_ENV production
RUN yarn run prisma:generate
RUN yarn run build

FROM node:18-slim

ARG git_commit=unspecified
LABEL git_commit="${git_commit}"
LABEL org.opencontainers.image.source="https://github.com/FRINXio/frinx-inventory-server"

RUN apt-get update
RUN apt-get install -y openssl wget

RUN mkdir /app
RUN chmod +w /app
# running as root is bad
USER node
# We need to set production for Node.js
ENV NODE_ENV production

# We run on all network-interfaces
ENV HOST 0.0.0.0
ENV PORT 8000

# we inform docker that we run on port8000
EXPOSE 8000


COPY --from=build /app/build /app
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/sample.csv /app/sample.csv
COPY --from=build /app/package.json /app

WORKDIR /app
USER root
RUN yarn install --production
USER node

CMD ["node", "index.js"]
