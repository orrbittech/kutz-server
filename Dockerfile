# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for the build
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy source and compile to dist/
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN yarn build

# Re-install only production deps to shrink the runtime image
RUN rm -rf node_modules \
  && yarn install --frozen-lockfile --production --network-timeout 600000 \
  && yarn cache clean

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=384 \
    PORT=3001

# Copy only what's needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# Run as the non-root user that the node image ships with
USER node

CMD ["node", "dist/main"]
