FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown -R nextjs:nodejs .next
RUN mkdir logs
RUN chown -R nextjs:nodejs logs

# Copy the build output and set permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Create required directories and ensure proper permissions
RUN mkdir -p node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma/client node_modules/.prisma/client

# Switch to non-root user
USER nextjs

# Set up health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/api/health', timeout: 2000 }; const request = http.request(options, (res) => { process.exit(res.statusCode >= 200 && res.statusCode < 400 ? 0 : 1); }); request.on('error', () => process.exit(1)); request.end()"

# Expose the server port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"] 