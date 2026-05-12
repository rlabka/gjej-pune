# ─── Backend Dockerfile (Express + Prisma + PostgreSQL) ───
# Build context: project root
FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# ─── Install all deps ────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# ─── Build ────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Generate Prisma client
RUN npx prisma generate --schema=packages/backend/src/database/schema.prisma

# Build shared package first
WORKDIR /app/packages/shared
RUN npx tsc

# Build backend TypeScript
WORKDIR /app/packages/backend
RUN npx tsc || true

# ─── Production ──────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy everything needed to run
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/src/database/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/package.json ./

# Apple Root CA certs — must sit next to compiled iap.service.js because
# the runtime does fs.readFileSync(path.join(__dirname, 'apple-certs', …)).
# TypeScript only emits .js, so we have to bring the .cer files in by hand.
COPY --from=builder /app/packages/backend/src/services/apple-certs ./dist/services/apple-certs

# Copy shared package (node_modules/@jmp/shared symlink points here)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Create uploads directory
RUN mkdir -p /app/uploads

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend && \
    chown -R backend:nodejs /app
USER backend

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss 2>/dev/null; node dist/server.js"]
