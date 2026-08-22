# syntax=docker/dockerfile:1.7
#
# Multi-stage: the runtime image carries the compiled output, not the source.
#
# It does keep the full dependency tree rather than pruning to production only,
# because the container runs `prisma migrate deploy` at boot and the Prisma CLI
# is a devDependency. Pruning it saves a few hundred MB and breaks every deploy.

FROM node:24-bookworm-slim AS base
WORKDIR /app

# --- deps ---------------------------------------------------------------
# NODE_ENV is deliberately not "production" here. npm would prune the
# devDependencies, and the build needs prisma and tsc — the failure is an
# exit code 127 from `npm run build` with no hint of what is missing.
FROM base AS deps
# argon2 builds a native addon; python3/make/g++ are needed only here.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
# The API consumes @codelock/shared as source (the demo service imports its
# types). Without the workspace manifest here, npm ci never links it and the
# build fails with 'Cannot find module @codelock/shared'.
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @codelock/api --include-workspace-root

# --- build --------------------------------------------------------------
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace @codelock/api

# --- runtime ------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# From `build`, not `deps`. `prisma generate` writes the generated client into
# node_modules/.prisma during the build stage; copying the deps tree instead
# leaves it out, and the container starts, runs its migrations, and only then
# dies with "@prisma/client did not initialize yet".
#
# npm workspaces hoist everything to the root, so there is no
# apps/api/node_modules to copy either.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Never run as root.
USER node
WORKDIR /app/apps/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migrations run at boot so a fresh container is never ahead of its schema.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
