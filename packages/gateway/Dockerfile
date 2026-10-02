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

COPY scripts/graceful-start.sh /usr/local/bin/graceful-start.sh
RUN chmod +x /usr/local/bin/graceful-start.sh

RUN npm ci --omit=dev
CMD ["node", "packages/gateway/dist/server.js"]

# Entrypoint + healthcheck
ENTRYPOINT ["/usr/local/bin/graceful-start.sh"]

HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:4000/runtime-health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
