# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Add health check script
COPY --from=builder /app/package.json ./package.json

# Create startup script before switching user
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Tally application..."' >> /app/start.sh && \
    echo 'echo "Initializing database..."' >> /app/start.sh && \
    echo 'npx prisma db push --skip-generate' >> /app/start.sh && \
    echo 'echo "Database initialized, starting server..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/tally.db"
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Initialize database and start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]