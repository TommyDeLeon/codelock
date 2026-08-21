# syntax=docker/dockerfile:1.7
#
# The web app, for people self-hosting the whole stack on one box. Vercel users
# do not need this file.
#
# Note the build args: NEXT_PUBLIC_* values are inlined into the client bundle
# at build time, not read at runtime. Setting them in docker-compose `env` would
# do nothing at all — the bundle would still point at localhost.

FROM node:24-bookworm-slim AS base
WORKDIR /app

# --- deps ---------------------------------------------------------------
# NODE_ENV is deliberately NOT production here. npm would prune the
# devDependencies, and next build needs tailwindcss, @tailwindcss/postcss and
# typescript — without them the build dies at "Failed to collect page data"
# with no mention of the missing plugin.
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @codelock/web --include-workspace-root

# --- build --------------------------------------------------------------
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_TELEMETRY_DISABLED=1
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm run build --workspace @codelock/web

# --- runtime ------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# The standalone bundle carries its own minimal node_modules; nothing else from
# the build stage is needed.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
