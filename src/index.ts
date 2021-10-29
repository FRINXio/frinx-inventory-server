import config from './config';
import prismaClient from './prisma-client';
import { log, runCacheClear, runSyncZones, server } from './server';

// show startup message when server starts
server.on('listening', () => {
  log.info(`
    Server running on host ${config.host}
    Server running on port ${config.port}
  `);
  runSyncZones(server);
  runCacheClear(server);
});

server.listen({
  host: config.host,
  port: config.port,
});

// when called, the server will stop handling new requests
// and when all existing requests finish it will exit the process
function close() {
  log.info('got signal to shut down, stopping accepting new connections');
  prismaClient.$disconnect();
  if (server) {
    server.close(() => {
      log.info('all connections closed. exiting.');
      process.exit(0);
    });
  }
}

// SIGTERM is the please-shut-down signal sent by docker/kubernetes/kill-command
process.on('SIGTERM', close);

// SIGINT is sent when the user presses control-c in the console where node is running
process.on('SIGINT', close);
