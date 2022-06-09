import pino from 'pino';
import isDev from './is-dev';

type Logger = {
  info: (text: string) => void;
  error: (text: string) => void;
};

function getLogger(name: string): Logger {
  const logger = pino({
    name,
    base: {},
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
    formatters: {
      level: (label) => ({ level: label }), // show log-level as text, like `"error"`, not as number, like `50`.
    },
  });
  return {
    info: (text: string) => {
      logger.info(text);
    },
    error: (text: string) => {
      logger.error(text);
    },
  };
}

export default getLogger;
