FROM node:22-alpine

WORKDIR /app

# Pin pnpm to v10. pnpm 11 treats ignored build scripts (e.g. sharp's native
# bindings) as a hard install error; v10 only warns. Lockfiles from recent
# pnpm versions are still compatible.
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Pre-approve native build scripts we depend on (Next.js image optimizer).
RUN printf 'only-built-dependencies[]=sharp\n' > /app/.npmrc

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile && pnpm rebuild sharp

COPY . .

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["pnpm", "dev", "-H", "0.0.0.0", "-p", "3000"]
