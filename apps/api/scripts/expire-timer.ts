/**
 * Bring the current session's deadline forward so the lock fires now.
 *
 *   npm run dev:expire -w @codelock/api
 *
 * Testing the lock screen otherwise means waiting out a real timer — the
 * shortest session the API accepts is five minutes, deliberately, because a
 * shorter one would not be a focus block. This talks straight to the database
 * and is not reachable through the API, so it cannot be used to skip a lock.
 * Development only.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run against a production database.');
    process.exit(1);
  }

  const { count } = await prisma.lockSession.updateMany({
    where: { state: 'ARMED' },
    data: { fireAt: new Date(Date.now() - 60_000) },
  });

  if (count === 0) {
    console.log('No armed session. Start a focus block on the dashboard first.');
    return;
  }
  console.log(`Expired ${count} session(s). Reload the dashboard — the lock is due.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
