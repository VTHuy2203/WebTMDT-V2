FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY backend ./backend
RUN npm ci
RUN npm run db:generate
RUN npm run build --workspace=@marketplace/api && npm run build --workspace=@marketplace/worker

FROM node:22-bookworm-slim AS api
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace /workspace
USER node
CMD ["node", "apps/api/dist/main.js"]

FROM node:22-bookworm-slim AS worker
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace /workspace
USER node
CMD ["node", "apps/worker/dist/main.js"]
