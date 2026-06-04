# Multi-stage Dockerfile. Local dev (docker-compose.yml) targets `dev`.
# Production (docker-compose.prod.yml) targets `runner`.

# ---------- base: pnpm + deps ----------
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN printf 'only-built-dependencies[]=sharp\n' > /app/.npmrc

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile && pnpm rebuild sharp

# ---------- dev: hot-reload server ----------
FROM base AS dev
COPY . .
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["pnpm", "dev", "-H", "0.0.0.0", "-p", "3000"]

# ---------- builder: produce .next ----------
FROM base AS builder
COPY . .
# NEXT_PUBLIC_* must be present at build time (they bake into the client bundle).
ARG NEXT_PUBLIC_DASHBOARD_URL
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
RUN pnpm build

# ---------- runner: minimal prod image ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN printf 'only-built-dependencies[]=sharp\n' > /app/.npmrc

# Production deps only.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm rebuild sharp

# Built app artifacts.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000
CMD ["pnpm", "start", "-H", "0.0.0.0", "-p", "3000"]
