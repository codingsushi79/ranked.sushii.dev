# syntax=docker/dockerfile:1

# --- Next.js app ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG AUTH_SECRET=build-time-secret-at-least-32-chars
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

# --- Windows client (cross-compile x64 via Wine on Mac/Linux) ---
FROM electronuserland/builder:wine AS client-export
WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./

ENV RANKED_UPDATE_URL=https://github.com/codingsushi79/ranked.sushii.dev/releases/download/client-latest
RUN node scripts/bake-update-config.mjs \
  && npm run build:ui \
  && npm run build:electron \
  && cp electron/update-config.baked.json dist-electron/electron/update-config.baked.json \
  && npx electron-builder --config electron-builder.config.cjs --win portable --x64 --publish never \
  && mkdir -p /out \
  && mv ../public/downloads/build/ranked-cs2-client-setup.exe /out/ranked-cs2-client-setup.exe \
  && rm -rf ../public/downloads/build

WORKDIR /out
