FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/gateway-server ./apps/gateway-server

RUN npm ci
RUN npx tsc -b packages/shared apps/gateway-server

FROM node:20-alpine AS runtime
WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/apps/gateway-server/dist ./apps/gateway-server/dist
COPY --from=build /workspace/packages/shared/dist ./packages/shared/dist

CMD ["node", "apps/gateway-server/dist/server.js"]
