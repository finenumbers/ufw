FROM golang:1.25-bookworm AS awg-build
ARG AWG_GO_VERSION=v3.1.20260828
ARG AWG_GO_SHA256=24c656cfb80ff6855702710eaf2e3729fa710bf6bfdbbbdfba01984ccd17de95
ARG AWG_TOOLS_VERSION=v3.1.20260812
ARG AWG_TOOLS_SHA256=dbd8ce0748d835d18f30bb76720246b7bfc80bd09cd17c379b1c59f683a18493
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gcc libc6-dev libmnl-dev make pkg-config \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN mkdir -p /out \
  && curl -fsSL -o go.tgz "https://github.com/amnezia-vpn/amneziawg-go/archive/refs/tags/${AWG_GO_VERSION}.tar.gz" \
  && echo "${AWG_GO_SHA256}  go.tgz" | sha256sum -c - \
  && tar -xzf go.tgz \
  && printf 'package main\n\nconst Version = "%s"\n' "${AWG_GO_VERSION}" > "amneziawg-go-${AWG_GO_VERSION#v}/version.go" \
  && cd "amneziawg-go-${AWG_GO_VERSION#v}" \
  && CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" -o /out/amneziawg-go .
RUN curl -fsSL -o tools.tgz "https://github.com/amnezia-vpn/amneziawg-tools/archive/refs/tags/${AWG_TOOLS_VERSION}.tar.gz" \
  && echo "${AWG_TOOLS_SHA256}  tools.tgz" | sha256sum -c - \
  && tar -xzf tools.tgz \
  && make -C "amneziawg-tools-${AWG_TOOLS_VERSION#v}/src" -j"$(nproc)" \
  && install -m 0755 "amneziawg-tools-${AWG_TOOLS_VERSION#v}/src/wg" /out/awg

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
  && apt-get install -y --no-install-recommends openssl ca-certificates nmap curl unzip iputils-ping libcap2-bin iproute2 iptables util-linux libmnl0 \
  && ping_bin="$(command -v ping)" \
  && setcap cap_net_raw=ep "$ping_bin" \
  && setcap -v cap_net_raw=ep "$ping_bin" \
  && curl -sL "https://github.com/projectdiscovery/naabu/releases/download/v${NAABU_VERSION}/naabu_${NAABU_VERSION}_linux_amd64.zip" -o /tmp/naabu.zip \
  && unzip /tmp/naabu.zip -d /tmp/naabu \
  && install -m 0755 /tmp/naabu/naabu /usr/local/bin/naabu \
  && rm -rf /tmp/naabu /tmp/naabu.zip \
  && apt-mark manual iputils-ping iproute2 iptables util-linux libmnl0 \
  && apt-get purge -y --auto-remove curl unzip \
  && command -v ping >/dev/null \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/awg-helper.mjs /usr/local/lib/awg-helper.mjs
COPY --from=awg-build /out/amneziawg-go /out/awg /usr/local/bin/
RUN chmod +x /entrypoint.sh \
  && amneziawg-go --version \
  && awg --version

EXPOSE 8088

ENTRYPOINT ["/entrypoint.sh"]
