FROM node:18-slim as build

RUN apt-get update
RUN apt-get install -y openssl

RUN mkdir /app

# We need to set production for Node.js
# first we copy things that are needed for npm-install
COPY . /app/

WORKDIR /app
RUN npm ci
ENV NODE_ENV production
RUN npm run prisma:generate
RUN npm run build

FROM node:18-slim

ARG git_commit=unspecified
LABEL git_commit="${git_commit}"
LABEL org.opencontainers.image.source="https://github.com/FRINXio/frinx-inventory-server"

RUN apt-get update \
    && apt-get install -y --quiet --no-install-recommends openssl wget \
    && apt-get -y autoremove \
    && apt-get clean autoclean \
    && rm -rf /var/lib/apt/lists/{apt,dpkg,cache,log}

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
COPY --from=build /app/package-lock.json /app

WORKDIR /app
USER root
RUN npm install --production
USER node

CMD ["node", "index.js"]
