#!/usr/bin/env bash
set -euo pipefail

# Post-deploy smoke checks for UFW Remote Manager.
#
# Usage:
#   ./scripts/smoke-production.sh --env-file .env --ghcr
#   ./scripts/smoke-production.sh --env-file .env --app-url https://ufw.example.com
#
# See docs/en/operations/smoke-tests.md

ENV_FILE=""
USE_GHCR=0
APP_URL_ARG=""
COMPOSE=(docker compose)

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --env-file PATH   Load compose env from file (recommended for production)
  --ghcr            Use docker-compose.ghcr.yml overlay (pull-based deploy)
  --app-url URL     Also check public HTTPS /api/health (via curl)
  -h, --help        Show this help

Examples:
  $(basename "$0") --env-file .env --ghcr
  $(basename "$0") --env-file .env --ghcr --app-url https://ufw.example.com
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --ghcr)
      USE_GHCR=1
      shift
      ;;
    --app-url)
      APP_URL_ARG="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

COMPOSE+=( -f docker-compose.yml -f docker-compose.prod.yml )
if [[ "$USE_GHCR" -eq 1 ]]; then
  COMPOSE+=( -f docker-compose.ghcr.yml )
fi
if [[ -n "$ENV_FILE" ]]; then
  COMPOSE+=( --env-file "$ENV_FILE" )
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

APP_CONTAINER="${APP_CONTAINER:-ufw-app}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ufw-postgres}"
MIGRATE_CONTAINER="${MIGRATE_CONTAINER:-ufw-migrate}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "OK: $*"
}

echo "== Container status =="
"${COMPOSE[@]}" ps

echo
echo "== Postgres =="
docker inspect "$POSTGRES_CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null \
  | grep -qx healthy \
  || fail "$POSTGRES_CONTAINER is not healthy"

pass "$POSTGRES_CONTAINER is healthy"

echo
echo "== Migrate =="
MIGRATE_STATUS="$(docker inspect "$MIGRATE_CONTAINER" --format '{{.State.Status}}' 2>/dev/null || true)"
MIGRATE_EXIT="$(docker inspect "$MIGRATE_CONTAINER" --format '{{.State.ExitCode}}' 2>/dev/null || true)"

if [[ "$MIGRATE_STATUS" != "exited" ]]; then
  fail "$MIGRATE_CONTAINER status is '$MIGRATE_STATUS' (expected exited)"
fi
if [[ "$MIGRATE_EXIT" != "0" ]]; then
  fail "$MIGRATE_CONTAINER exit code is $MIGRATE_EXIT (expected 0)"
fi

pass "$MIGRATE_CONTAINER exited 0"

echo
echo "== App health (internal) =="
APP_HEALTH="$(docker inspect "$APP_CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null || true)"
if [[ "$APP_HEALTH" != "healthy" ]]; then
  fail "$APP_CONTAINER health is '$APP_HEALTH' (expected healthy)"
fi

HEALTH_JSON="$(docker exec "$APP_CONTAINER" node -e \
  "fetch('http://127.0.0.1:8088/api/health').then(async (r) => console.log(await r.text())).catch((e) => { console.error(e); process.exit(1); })")"

echo "$HEALTH_JSON"
echo "$HEALTH_JSON" | grep -q '"status":"ok"' \
  || fail "/api/health did not return status ok"

pass "internal /api/health"

PUBLIC_URL="${APP_URL_ARG:-${APP_URL:-}}"
if [[ -n "$PUBLIC_URL" ]]; then
  echo
  echo "== Public health (${PUBLIC_URL}) =="
  if ! command -v curl >/dev/null 2>&1; then
    echo "SKIP: curl not installed — cannot check public URL"
  else
    PUBLIC_BODY="$(curl -sf "${PUBLIC_URL%/}/api/health")"
    echo "$PUBLIC_BODY"
    echo "$PUBLIC_BODY" | grep -q '"status":"ok"' \
      || fail "public /api/health failed"
    pass "public /api/health"
  fi
fi

echo
echo "== Manual checklist =="
CHECK_URL="${PUBLIC_URL:-${APP_URL:-https://your-domain.example.com}}"
cat <<EOF

Automated checks passed. Complete these in a browser:

  1. Open ${CHECK_URL}/login (or /setup on first install)
  2. Log in as admin
  3. Identities → create or verify an SSH identity
  4. Servers → add server → run SSH test
  5. Rules → run apply preview (no apply required)

Docs: docs/en/operations/smoke-tests.md

EOF

pass "smoke test complete"
