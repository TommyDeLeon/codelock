import { PrismaClient } from '@prisma/client';
import { env } from '../env.js';

/**
 * Single client for the process. `globalThis` caching keeps tsx watch-mode
 * reloads from opening a new pool on every file save.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['warn', 'error'] : ['query', 'warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
