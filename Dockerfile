# Multi-stage Dockerfile for AlpacaTrader
# Production-ready Node.js application

# Stage 1: Build shared module
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci
COPY shared/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY --from=shared-builder /app/shared /app/shared
RUN npm run build

# Stage 3: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 4: Production runtime
FROM node:20-alpine
LABEL maintainer="AlpacaTrader"
LABEL description="AlpacaTrader - Stock Trading Application"

# Install production dependencies
RUN apk add --no-cache tini curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy shared module
COPY --from=shared-builder --chown=nodejs:nodejs /app/shared ./shared

# Copy server build and dependencies
COPY --from=server-builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=server-builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules

# Copy client build
COPY --from=client-builder --chown=nodejs:nodejs /app/client/dist ./client/dist

# Copy configuration files
COPY --chown=nodejs:nodejs ecosystem.config.js ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "server/dist/server.js"]
