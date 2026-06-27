FROM node:22-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgresql://ufw:ufw@postgres:5432/ufw?schema=public
ENV NEXT_TELEMETRY_DISABLED=1
ARG APP_VERSION=0.0.0-dev
ARG BUILD_SHA=unknown
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
ENV NEXT_PUBLIC_BUILD_SHA=$BUILD_SHA

RUN npx prisma generate
RUN npm run build

FROM builder AS migrator
WORKDIR /app
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8088
ENV HOSTNAME=0.0.0.0
ARG NAABU_VERSION=2.3.5

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates nmap curl unzip \
  && curl -sL "https://github.com/projectdiscovery/naabu/releases/download/v${NAABU_VERSION}/naabu_${NAABU_VERSION}_linux_amd64.zip" -o /tmp/naabu.zip \
  && unzip /tmp/naabu.zip -d /tmp/naabu \
  && install -m 0755 /tmp/naabu/naabu /usr/local/bin/naabu \
  && rm -rf /tmp/naabu /tmp/naabu.zip \
  && apt-get purge -y --auto-remove curl unzip \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs

EXPOSE 8088

ENTRYPOINT ["/entrypoint.sh"]
