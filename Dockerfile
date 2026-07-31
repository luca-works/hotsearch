# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_PATH="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
  && pnpm config set store-dir $PNPM_STORE_PATH

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder

ARG NEXT_PUBLIC_APP_NAME="今日热榜"
ARG NEXT_PUBLIC_APP_DESC="汇聚全网热点，热门尽览无余"
ARG NEXT_PUBLIC_APP_URL="http://localhost:18080"
ARG NEXT_PUBLIC_COPYRIGHT="HotSearch"
ARG NEXT_PUBLIC_THEME="light"

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DESC=$NEXT_PUBLIC_APP_DESC
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_COPYRIGHT=$NEXT_PUBLIC_COPYRIGHT
ENV NEXT_PUBLIC_THEME=$NEXT_PUBLIC_THEME

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV VISIT_LOG_PATH="/data/visits.jsonl"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /data \
  && chown -R nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chmod -R u+rwX,go+rX ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
