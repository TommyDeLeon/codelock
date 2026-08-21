import pino from 'pino';
import { env } from '../env.js';

export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.passwordHash',
      'sourceCode',
      '*.sourceCode',
    ],
    remove: true,
  },
  transport: env.isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
