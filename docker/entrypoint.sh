#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo "BETTER_AUTH_SECRET is required in production" >&2
    exit 1
  fi
  if [ -z "$APP_ENCRYPTION_KEY" ]; then
    echo "APP_ENCRYPTION_KEY is required in production" >&2
    exit 1
  fi
  if [ -z "$APP_URL" ] && [ -z "$BETTER_AUTH_URL" ]; then
    echo "APP_URL is required in production" >&2
    exit 1
  fi
fi

if [ -x /usr/local/bin/amneziawg-go ]; then
  mkdir -p /run/awg /var/run/amneziawg
  chown root:nodejs /run/awg
  chmod 0750 /run/awg
  node /usr/local/lib/awg-helper.mjs &
  i=0
  while [ ! -S /run/awg/helper.sock ] && [ "$i" -lt 50 ]; do
    i=$((i + 1))
    sleep 0.1
  done
fi

exec setpriv --reuid=nextjs --regid=nodejs --init-groups --inh-caps=-all node server.js
