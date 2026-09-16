#!/usr/bin/env bash
# Restart the host judge when it stalls: work queued, nothing active, for
# STALL_SECONDS. Seen once during authoring; a stalled judge hangs a batch
# forever. Runs beside author-loop.sh. Stop with scripts/.author-stop.
set -u
cd "$(dirname "$0")/.."
STALL_SECONDS=300
# Note: the loop and this script both honour scripts/.author-stop.
LOG=scripts/author-loop.log
stalled_since=0
while [ ! -f scripts/.author-stop ]; do
  h=$(curl -s -m 5 http://127.0.0.1:2358/healthz || echo '')
  # `queued` is work waiting; `bulk` is retained results and is non-zero
  # while the judge sits idle between batches, so it must not be the signal.
  queued=$(printf '%s' "$h" | sed -n 's/.*"queued":\([0-9]*\).*/\1/p')
  active=$(printf '%s' "$h" | sed -n 's/.*"active":\([0-9]*\).*/\1/p')
  now=$(date +%s)
  if [ -z "$h" ] || { [ "${queued:-0}" -gt 0 ] && [ "${active:-0}" -eq 0 ]; }; then
    [ "$stalled_since" -eq 0 ] && stalled_since=$now
    if [ $((now - stalled_since)) -ge "$STALL_SECONDS" ]; then
      printf '%s watchdog: judge stalled (%s); restarting\n' "$(date -u +%FT%TZ)" "${h:-unreachable}" >> "$LOG"
      docker stop codelock-judge-host >/dev/null 2>&1
      sleep 2
      npm run -s judge:host >/dev/null 2>&1
      stalled_since=0
      sleep 30
    fi
  else
    stalled_since=0
  fi
  sleep 30
done
