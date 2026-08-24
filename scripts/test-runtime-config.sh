#!/usr/bin/env bash
# Regression test: a prebuilt web image must take its API origin at RUN time.
#
#   ./scripts/test-runtime-config.sh [--no-build]
#
# Why this exists
# ---------------
# NEXT_PUBLIC_* is inlined into the client bundle when the image is built, so
# the image published by .github/workflows/publish-images.yml carries whatever
# CI had — which is nothing. A deployment pulling that image would hand every
# visitor's browser its own localhost:4000. The page renders, the layout is
# perfect, and not one request reaches the server: the worst kind of failure,
# because it looks like a working install.
#
# The fix serves the origin from /runtime-config.js, read per request. That has
# two halves and BOTH have to hold — the second is easy to forget, and breaking
# it fails exactly like the original bug:
#
#   1. /runtime-config.js reports the configured origin.
#   2. The Content-Security-Policy allows the browser to talk to it. A correct
#      apiUrl with connect-src still pinned to 'self' is a page that knows the
#      right address and is forbidden from using it.
#
# Deliberately not localhost: localhost passing proves nothing, because that is
# also what the broken build-time default produces.
set -euo pipefail

cd "$(dirname "$0")/.."

readonly IMAGE=codelock-web:runtime-config-test
readonly NAME=codelock-runtime-config-test
readonly PORT=39173
# An origin that cannot be reached and cannot be a default. .invalid is reserved
# by RFC 2606, so nothing can resolve it by accident.
readonly ORIGIN=https://api.regression.invalid

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cleanup

if [ "${1:-}" != "--no-build" ]; then
  echo "building the web image..."
  docker build -f apps/web/Dockerfile -t "$IMAGE" . >/dev/null
else
  docker tag codelock-web:latest "$IMAGE"
fi

echo "starting it with CODELOCK_API_URL=$ORIGIN"
docker run -d --name "$NAME" -e CODELOCK_API_URL="$ORIGIN" -p "$PORT:3000" "$IMAGE" >/dev/null

# Poll rather than sleep: a fixed wait is either flaky or slow.
for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:$PORT/runtime-config.js" >/dev/null 2>&1; then break; fi
  sleep 1
done

body=$(curl -fsS "http://localhost:$PORT/runtime-config.js")
headers=$(curl -fsSI "http://localhost:$PORT/runtime-config.js")
csp=$(printf '%s' "$headers" | tr -d '\r' | grep -i '^content-security-policy:' || true)

failed=0
fail() { red "FAIL: $1"; failed=1; }

# 1. The origin the deployment configured, served to the browser.
case "$body" in
  *"$ORIGIN"*) green "ok   /runtime-config.js reports $ORIGIN" ;;
  *) fail "/runtime-config.js does not contain $ORIGIN"; printf '  body: %s\n' "$body" ;;
esac

# 2. The build-time default must not have survived into the response.
case "$body" in
  *localhost*) fail "/runtime-config.js still mentions localhost — build-time default leaked"; printf '  body: %s\n' "$body" ;;
  *) green "ok   no localhost fallback in the body" ;;
esac

# 3. A policy header has to exist at all before its contents mean anything.
if [ -z "$csp" ]; then
  fail "no Content-Security-Policy header on the response"
else
  # 4. ...and it must permit reaching that origin.
  case "$csp" in
    *"connect-src"*"$ORIGIN"*) green "ok   CSP connect-src allows $ORIGIN" ;;
    *) fail "CSP connect-src does not allow $ORIGIN"; printf '  %s\n' "$csp" ;;
  esac
fi

echo
if [ "$failed" -ne 0 ]; then
  red "runtime configuration is broken: a prebuilt image would deploy and serve nothing."
  exit 1
fi

green "runtime config holds: a prebuilt image can be pointed at any API origin."
