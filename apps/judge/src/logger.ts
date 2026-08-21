import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Submitted source can be large and is not ours to log.
  redact: { paths: ['source', '*.source'], remove: true },
});
