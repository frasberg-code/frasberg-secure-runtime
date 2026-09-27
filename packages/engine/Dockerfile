FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.base.json .prettierrc.json ./
COPY packages ./packages
COPY scripts ./scripts
RUN npm ci
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/packages ./packages

# Copy helper scripts from build context (also available in build stage)
COPY scripts/graceful-start.sh /usr/local/bin/graceful-start.sh
COPY scripts/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/graceful-start.sh /usr/local/bin/healthcheck.sh

RUN npm ci --omit=dev

# Healthcheck env defaults (override in task definition)
ENV HEALTH_HOST=127.0.0.1
ENV HEALTH_PORT=3000
ENV HEALTH_PATH=/health

# Entrypoint forwards signals to the app process
ENTRYPOINT ["/usr/local/bin/graceful-start.sh"]
CMD ["node", "packages/engine/dist/server.js"]

HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD /usr/local/bin/healthcheck.sh || exit 1
