# Production Dockerfile for Express + Prisma
# Based on Prisma official Docker documentation

FROM node:22-slim

# Install OpenSSL (required by Prisma on Debian-based images)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including prisma for migrations)
RUN npm ci

# Copy prisma schema and config
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
