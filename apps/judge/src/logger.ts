import { env } from './env.js';
import pino from 'pino';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Submitted source can be large and is not ours to log.
  redact: { paths: ['source', '*.source'], remove: true },
});
