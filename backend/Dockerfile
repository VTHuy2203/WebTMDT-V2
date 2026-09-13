FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/admin-web/package.json ./apps/admin-web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/buyer-web/package.json ./apps/buyer-web/package.json
COPY apps/seller-web/package.json ./apps/seller-web/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/analytics/package.json ./packages/analytics/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/validation/package.json ./packages/validation/package.json
COPY backend/prisma/schema.prisma ./backend/prisma/schema.prisma
RUN npm ci
COPY apps ./apps
COPY packages ./packages
COPY backend ./backend
RUN npm run db:generate
RUN npm run build --workspace=@marketplace/api && npm run build --workspace=@marketplace/worker
RUN npm prune --omit=dev

FROM base AS api
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace /workspace
USER node
CMD ["node", "apps/api/dist/main.js"]

FROM base AS worker
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace /workspace
USER node
CMD ["node", "apps/worker/dist/main.js"]
