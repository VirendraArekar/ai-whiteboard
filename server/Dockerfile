# Multi-stage Dockerfile for NestJS API Server
FROM node:24-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Build stage
FROM dependencies AS build
WORKDIR /app
COPY server/ ./server/
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:24-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules
ENV PATH="/app/node_modules/.bin:$PATH"

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma
COPY --from=build /app/server/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push --skip-generate && (node dist/prisma/seed.js || npx ts-node prisma/seed.ts || true) && (node dist/src/main || node dist/main)"]
