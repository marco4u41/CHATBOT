# Frontend Dockerfile — Multi-stage para desarrollo y producción
# ──────────────────────────────────────────────
# Uso:
#   Desarrollo:  docker compose up frontend
#   Producción:  BUILD_TARGET=production docker compose up frontend
# ──────────────────────────────────────────────

# ============================================================
# BASE — Node.js + dependencias
# ============================================================
FROM node:20-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# ============================================================
# DEVELOPMENT — Vite dev server con HMR
# ============================================================
FROM base AS development

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================================
# BUILD — Compilar para producción
# ============================================================
FROM base AS build

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# PRODUCTION — Nginx sirviendo estáticos
# ============================================================
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]