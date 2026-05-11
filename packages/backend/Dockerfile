# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

# Copy source
COPY packages/shared  ./packages/shared
COPY packages/backend ./packages/backend

# Generate Prisma client & compile backend
RUN cd packages/backend && npx prisma generate
RUN npm run build -w packages/backend

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

# Workspace manifests (needed for npm ci workspace resolution)
COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install production deps + keep prisma CLI for migrations
RUN npm ci --omit=dev
# Restore prisma CLI (devDep needed to run migrate deploy)
COPY --from=builder /app/node_modules/prisma          ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma     ./node_modules/.bin/prisma

# Built output
COPY --from=builder /app/packages/backend/dist        ./packages/backend/dist

# Prisma schema (for migrate deploy) + generated client
COPY packages/backend/prisma                          ./packages/backend/prisma
COPY --from=builder /app/node_modules/.prisma         ./node_modules/.prisma

# Volume mount point for SQLite file
RUN mkdir -p /data

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", \
  "node_modules/.bin/prisma migrate deploy --schema=packages/backend/prisma/schema.prisma && \
   node packages/backend/dist/main.js"]
