# Production Dockerfile for Express + Prisma 7
# Based on Prisma official Docker documentation

FROM node:22-slim

# Install OpenSSL (required by Prisma on Debian-based images)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install dependencies (prisma is in dependencies for migrations)
RUN npm ci && npm cache clean --force

# Copy prisma schema and config (required for Prisma 7)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Railway injects PORT env var
ENV PORT=3000
EXPOSE $PORT

# Start the application
CMD ["node", "server.js"]
