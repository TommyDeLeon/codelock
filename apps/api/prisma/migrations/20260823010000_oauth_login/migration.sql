-- Signing in (and signing up) through an identity provider.

-- An account created through a provider has no password. Existing rows are
-- unaffected: dropping NOT NULL never invalidates data already present.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE TYPE "OAuthProvider" AS ENUM ('GITHUB', 'GOOGLE');

CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    -- The provider's immutable account id, never the email: an email can be
    -- changed at the provider and would then point at a different person.
    "providerAccountId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- One provider identity maps to exactly one local user, and a user may hold at
-- most one identity per provider. Both are enforced here rather than in code so
-- a race between two concurrent callbacks cannot create a duplicate link.
CREATE UNIQUE INDEX "oauth_accounts_provider_providerAccountId_key"
    ON "oauth_accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "oauth_accounts_userId_provider_key"
    ON "oauth_accounts"("userId", "provider");

ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
