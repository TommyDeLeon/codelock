#!/usr/bin/env bash
# Fill deploy/.env with strong random secrets.
#
#   ./gen-secrets.sh          # writes .env from .env.example
#   $EDITOR .env              # then set the values only you know
#   ./deploy.sh
#
# The five generated values are the ones that must never be guessable and that
# nobody should be inventing by hand. JWT_UNLOCK_SECRET in particular is the key
# that decides whether a device unlocks: a weak one means anyone who can forge a
# token can release any lock.
#
# Everything else — your domains, TLS email, and GitHub OAuth credentials — is
# left blank on purpose. This script cannot know them, and inventing a
# plausible default is how a deployment ends up pointing at a domain that is not
# yours.
set -euo pipefail

cd "$(dirname "$0")"

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

[ -f .env.example ] || {
  red ".env.example is missing; run this from the deploy/ directory of a checkout."
  exit 1
}

# Never clobber a live deployment's secrets: rotating JWT_UNLOCK_SECRET
# invalidates every issued unlock token, and rotating ENCRYPTION_KEY makes every
# stored integration credential undecryptable.
if [ -f .env ]; then
  red ".env already exists. Refusing to overwrite it."
  echo "  Delete it first if you really want fresh secrets — but read the note"
  echo "  above: rotating these invalidates tokens and stored credentials."
  exit 1
fi

command -v openssl >/dev/null 2>&1 || {
  red "openssl is not installed."
  exit 1
}

# 48 raw bytes -> 64 base64 characters, comfortably past the 32-character
# minimum the API enforces, and safe to paste into an env file.
secret() { openssl rand -base64 48 | tr -d '\n=' | cut -c1-64; }

cp .env.example .env

set_var() {
  local key="$1" value="$2"
  # The separator is | because base64 output can contain / but never |.
  if grep -qE "^#?${key}=" .env; then
    sed -i.bak -E "s|^#?${key}=.*|${key}=${value}|" .env && rm -f .env.bak
  else
    printf '%s=%s\n' "$key" "$value" >>.env
  fi
}

set_var JWT_ACCESS_SECRET "$(secret)"
set_var JWT_REFRESH_SECRET "$(secret)"
set_var JWT_UNLOCK_SECRET "$(secret)"
set_var ENCRYPTION_KEY "$(secret)"
set_var POSTGRES_PASSWORD "$(secret)"

chmod 600 .env

green "Wrote deploy/.env with fresh secrets (mode 600)."
echo
echo "Still to fill in by hand:"
echo "  APP_DOMAIN       the hostname serving the web app"
echo "  API_DOMAIN       the hostname serving the API"
echo "  TLS_EMAIL        where Let's Encrypt sends expiry warnings"
echo "  GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET   optional, and only for the"
echo "                   GitHub mirroring integration"
echo
echo "Then: ./deploy.sh"
