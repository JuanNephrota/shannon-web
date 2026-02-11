#
# Multi-stage Dockerfile for Shannon Web Frontend
# Builds the API server and React frontend in a single container
#

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY packages/web ./packages/web

# Build all packages
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm for production install
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Create non-root user
RUN addgroup -g 1001 -S shannon && \
    adduser -u 1001 -S shannon -G shannon

# Create directory for settings file
RUN mkdir -p /app/data && chown -R shannon:shannon /app/data

# Switch to non-root user
USER shannon

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV TEMPORAL_ADDRESS=temporal:7233
ENV SHANNON_ROOT=/shannon

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the API server (which serves the frontend in production)
CMD ["node", "packages/api/dist/index.js"]
