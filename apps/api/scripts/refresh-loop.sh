#!/usr/bin/env bash
# Give fresh test data to problems the reviewer skipped for borrowed
# examples, a few at a time, forever: the upgrade workers keep adding to the
# skipped set, so this re-checks every ten minutes when it finds nothing.
# Commits under the shared git lock. Stop with scripts/.author-stop.
#
#   bash scripts/refresh-loop.sh [model]
set -u
cd "$(dirname "$0")/.."

MODEL=${1:-gemini-3.1-pro-low}
LOG=scripts/author-loop.log
STOP=scripts/.author-stop
GITLOCK=scripts/.author-gitlock
n=1
since_commit=0

log() { printf '%s [rf] %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

commit_progress() {
  local waited=0
  until mkdir "$GITLOCK" 2>/dev/null; do
    sleep 5; waited=$((waited + 5))
    if [ "$waited" -ge 600 ]; then log "git lock stuck; skipping this commit"; since_commit=0; return; fi
  done
  LOG_LEVEL=silent npm run -s import:corpus >/dev/null 2>&1 || log "import:corpus failed (will retry next round)"
  ( cd ../.. && git add -A apps/api/src/corpus data/NOTICE >/dev/null 2>&1 && git commit -q -m "tests" >/dev/null 2>&1 ) && log "committed" || log "nothing to commit"
  rmdir "$GITLOCK" 2>/dev/null
  since_commit=0
}

log "refresh loop start"
mkdir -p scripts/author-out
while [ ! -f "$STOP" ]; do
  result=$(LOG_LEVEL=silent npm run -s refresh:batch -- --count 3 --model "$MODEL" 2>&1 | grep -v "prisma:query\|DEP0190\|trace-deprecation" | tr '\r' '\n' | grep -v "waiting on\|judged [0-9]")
  printf '%s\n' "$result" > "scripts/author-out/refresh-$(printf '%03d' "$n").log"
  if printf '%s\n' "$result" | grep -q "no skipped problems need fresh tests"; then sleep 600; continue; fi
  summary=$(printf '%s\n' "$result" | grep -E '^\{"mode":"refresh"' | tail -1)
  if [ -z "$summary" ]; then
    log "refresh batch $n failed: $(printf '%s\n' "$result" | grep -iE 'error|limit|quota' | head -1 | cut -c1-160)"
    if printf '%s\n' "$result" | grep -qiE 'quota|usage limit|rate limit'; then sleep 900; else sleep 120; fi
    continue
  fi
  log "refresh batch $n: $(printf '%s' "$summary" | sed -n 's/.*"pending":\([0-9]*\),"accepted":\([0-9]*\),"rejected":\([0-9]*\).*/accepted=\2 rejected=\3 pending=\1/p')"
  n=$((n + 1)); since_commit=$((since_commit + 1))
  if [ "$since_commit" -ge 3 ]; then commit_progress; fi
done
commit_progress
log "refresh loop end"
