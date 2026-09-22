FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsoa.json ./
COPY src ./src
RUN pnpm build

FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
COPY config.yaml ./config.yaml

EXPOSE 2999
CMD ["node", "dist/index.js", "standalone"]
