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
RUN npm ci --omit=dev
CMD ["node", "packages/engine/dist/server.js"]
