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

# Add graceful start and healthcheck scripts
COPY scripts/graceful-start.sh /usr/local/bin/graceful-start.sh
COPY scripts/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/graceful-start.sh /usr/local/bin/healthcheck.sh

# Healthcheck env defaults (override at runtime / in ECS task definition if needed)
ENV HEALTH_HOST=127.0.0.1
ENV HEALTH_PORT=3000
ENV HEALTH_PATH=/health

# Use graceful-start to forward signals to Node and allow graceful shutdown
ENTRYPOINT ["/usr/local/bin/graceful-start.sh"]
CMD ["node", "apps/gateway-server/dist/server.js"]

HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD /usr/local/bin/healthcheck.sh || exit 1
