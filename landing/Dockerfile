# Next.js: install -> build -> minimal runtime
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN printf 'only-built-dependencies[]=sharp\n' > /app/.npmrc

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile && pnpm rebuild sharp

FROM base AS builder
COPY . .
ARG NEXT_PUBLIC_DASHBOARD_URL
ENV NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL}
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
RUN printf 'only-built-dependencies[]=sharp\n' > /app/.npmrc

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm rebuild sharp

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000
CMD ["pnpm", "start", "-H", "0.0.0.0", "-p", "3000"]
