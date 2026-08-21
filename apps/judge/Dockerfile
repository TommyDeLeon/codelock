# syntax=docker/dockerfile:1.7
#
# The judge spawns sibling containers via the host Docker socket, so this image
# contains only the Docker CLI — never a nested daemon.

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/judge/package.json apps/judge/
RUN npm ci --workspace @codelock/judge --include-workspace-root
COPY apps/judge ./apps/judge
RUN npm run build --workspace @codelock/judge

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# CLI only. The daemon stays on the host; see README for why this is a
# privileged trust boundary.
RUN apt-get update && apt-get install -y --no-install-recommends docker.io ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# npm workspaces hoist everything to the root; there is no
# apps/judge/node_modules to copy.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/judge/dist ./apps/judge/dist
COPY package.json ./
COPY apps/judge/package.json apps/judge/

WORKDIR /app/apps/judge
EXPOSE 2358

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:2358/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
