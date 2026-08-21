# syntax=docker/dockerfile:1.7
# Multi-stage: the runtime image carries no toolchain and no source.

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# --- deps ---------------------------------------------------------------
FROM base AS deps
# argon2 builds a native addon; python3/make/g++ are needed only here.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @codelock/api --include-workspace-root

# --- build --------------------------------------------------------------
FROM deps AS build
ENV NODE_ENV=development
COPY apps/api ./apps/api
RUN npm run build --workspace @codelock/api

# --- runtime ------------------------------------------------------------
FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
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
