-- Add TypeScript as a solvable language.
--
-- ALTER TYPE ... ADD VALUE is safe inside a transaction on PostgreSQL 12+ as
-- long as the new value is not used in that same transaction, which it is not:
-- problems gain TypeScript starter code through the seed, in a later session.
ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'TYPESCRIPT';
