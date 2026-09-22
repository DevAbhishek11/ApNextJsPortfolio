# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Portfolio + Blog + Admin CMS — production image
#
# This app REQUIRES a persistent filesystem and a long-running Node process
# (JSON data store in /app/data, media in /app/public/uploads, chunked build
# uploads). It is NOT a serverless app — deploy to a VPS / Railway / Render /
# Fly / any container host, and mount volumes for /app/data and
# /app/public/uploads (see docker-compose.yml).
# ---------------------------------------------------------------------------

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- Build ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runtime --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user for the Node process.
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Standalone server + static assets + public folder.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Writable runtime state: JSON data store + uploaded media + chunked build
# uploads. Seed content is auto-created from lib/db/defaults on first boot.
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public/uploads

USER nextjs
EXPOSE 3000

# Healthcheck: the public homepage must answer.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
