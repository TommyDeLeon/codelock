#!/usr/bin/env bash
# One command, fresh VPS to running stack.
#
#   git clone <repo> && cd codelock/deploy
#   cp .env.example .env && $EDITOR .env
#   ./deploy.sh
#
# The environment is checked here, before compose starts anything. A missing
# secret otherwise surfaces as a container that restarts forever, or worse as a
# service that boots with a default — for a lock app that means either "nobody
# can unlock" or "everybody can".
set -euo pipefail

cd "$(dirname "$0")"

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

# --- preflight -------------------------------------------------------------

command -v docker >/dev/null 2>&1 || {
  red "docker is not installed."
  echo "  curl -fsSL https://get.docker.com | sh"
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  red "docker compose v2 is not available (you may have the old docker-compose)."
  exit 1
}

[ -f .env ] || {
  red "deploy/.env is missing."
  echo "  cp .env.example .env  and fill it in."
  exit 1
}

set -a
# shellcheck disable=SC1091
. ./.env
set +a

missing=()
placeholder=()

require() {
  local name=$1
  local value=${!name:-}
  if [ -z "$value" ]; then
    missing+=("$name")
  elif [ "$value" = "app.example.com" ] ||
       [ "$value" = "api.example.com" ] ||
       [ "$value" = "you@example.com" ]; then
    placeholder+=("$name")
  fi
}

for name in APP_DOMAIN API_DOMAIN TLS_EMAIL \
            JWT_ACCESS_SECRET JWT_REFRESH_SECRET JWT_UNLOCK_SECRET \
            ENCRYPTION_KEY POSTGRES_PASSWORD; do
  require "$name"
done

if [ ${#missing[@]} -gt 0 ]; then
  red "Missing in deploy/.env:"
  printf '  - %s\n' "${missing[@]}"
  echo
  echo "Generate each secret separately:  openssl rand -base64 48"
  exit 1
fi

if [ ${#placeholder[@]} -gt 0 ]; then
  red "Still set to the example value in deploy/.env:"
  printf '  - %s\n' "${placeholder[@]}"
  exit 1
fi

# Distinct secrets, checked here as well as in the API, because finding out at
# boot means a container crash-looping behind a proxy that returns 502.
if [ "$JWT_ACCESS_SECRET" = "$JWT_REFRESH_SECRET" ] ||
   [ "$JWT_ACCESS_SECRET" = "$JWT_UNLOCK_SECRET" ] ||
   [ "$JWT_REFRESH_SECRET" = "$JWT_UNLOCK_SECRET" ]; then
  red "The three JWT secrets must all differ."
  exit 1
fi

for name in JWT_ACCESS_SECRET JWT_REFRESH_SECRET JWT_UNLOCK_SECRET ENCRYPTION_KEY; do
  value=${!name}
  if [ ${#value} -lt 32 ]; then
    red "$name is ${#value} characters; the API requires at least 32."
    exit 1
  fi
done

green "environment looks sane"

# --- build and start -------------------------------------------------------

echo "building images (first run pulls a lot; later runs are cached)..."
docker compose build

echo "starting..."
# --wait blocks until every service with a healthcheck reports healthy, so this
# script failing means the stack actually failed, not that it was still coming up.
docker compose up -d --wait

echo "pre-pulling sandbox language images..."
# Without this the first submission in each language pays the image download
# inside the grading request, which looks exactly like a hung judge.
docker compose exec -T judge node dist/pull-images.js || {
  red "language images did not pre-pull. Submissions will still work, but the"
  red "first one in each language will be slow. Retry with:"
  echo "  docker compose exec judge node dist/pull-images.js"
}

echo
green "CodeLock is up."
echo "  web   https://${APP_DOMAIN}"
echo "  api   https://${API_DOMAIN}/v1/health"
echo
echo "TLS certificates are provisioned on first request and can take a minute."
echo "Both domains must already point at this host's public IP."
echo
echo "Next, once, before you rely on any of this:"
echo "  ./restore.sh --list      confirm a dump exists"
echo "  ./restore.sh --latest    prove you can actually restore it"
