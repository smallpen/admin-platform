# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

COPY packages/shared  ./packages/shared
COPY packages/frontend ./packages/frontend

# VITE_API_BASE_URL defaults to /api/v1 (relative, handled by Nginx proxy)
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build -w packages/frontend

# ─── Stage 2: Nginx ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY packages/frontend/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
