#!/usr/bin/env bash
# Rewrite hand-authored statements into interview format, batch after batch,
# until none are pending. Runs beside author-loop.sh: it takes the same git
# lock to import and commit, so the two never collide on the repository.
#
#   bash scripts/upgrade-loop.sh
#
# Stop with: touch scripts/.author-stop   (shared with the authoring loop)
set -u
cd "$(dirname "$0")/.."

SHARD=${1:-0/1}
MODEL=${2:-gemini-3.1-pro-low}
WORKER=${SHARD%%/*}
LOG=scripts/author-loop.log
STOP=scripts/.author-stop
GITLOCK=scripts/.author-gitlock
COMMIT_EVERY=5
since_commit=0
failures=0

log() { printf '%s [up%s] %s\n' "$(date -u +%FT%TZ)" "$WORKER" "$*" | tee -a "$LOG"; }

quota_wait() {
  local mins
  mins=$(printf '%s' "$1" | sed -n 's/.*[Rr]esets in \([0-9]*\)m.*/\1/p' | head -1)
  if [ -n "$mins" ]; then log "quota reached; waiting $((mins + 1)) minutes for the reset"; sleep $(( (mins + 1) * 60 ));
  else log "quota reached; waiting 15 minutes"; sleep 900; fi
}

commit_progress() {
  local waited=0
  until mkdir "$GITLOCK" 2>/dev/null; do
    sleep 5; waited=$((waited + 5))
    if [ "$waited" -ge 600 ]; then log "git lock stuck; skipping this commit"; since_commit=0; return; fi
  done
  LOG_LEVEL=silent npm run -s import:corpus >/dev/null 2>&1 || log "import:corpus failed (will retry next round)"
  ( cd ../.. && git add -A apps/api/src/corpus data/NOTICE >/dev/null 2>&1 && git commit -q -m "statements" >/dev/null 2>&1 ) && log "committed" || log "nothing to commit"
  rmdir "$GITLOCK" 2>/dev/null
  since_commit=0
}

log "upgrade loop start"
mkdir -p scripts/author-out
n=1
while true; do
  if [ -f "$STOP" ]; then log "stop file found; finishing"; break; fi
  result=$(LOG_LEVEL=silent npm run -s upgrade:batch -- --count 8 --shard "$SHARD" --model "$MODEL" 2>&1 | grep -v "prisma:query\|DEP0190\|trace-deprecation" | tr '\r' '\n')
  printf '%s\n' "$result" > "scripts/author-out/upgrade-w$WORKER-$(printf '%03d' "$n").log"
  summary=$(printf '%s\n' "$result" | grep -E '^\{"mode":"upgrade"' | tail -1)
  if printf '%s\n' "$result" | grep -q "nothing to do"; then log "every statement upgraded"; break; fi
  if [ -z "$summary" ]; then
    failures=$((failures + 1))
    log "upgrade batch $n produced no summary (failure $failures): $(printf '%s\n' "$result" | grep -iE 'error|limit|quota' | head -1 | cut -c1-160)"
    if printf '%s\n' "$result" | grep -qiE 'quota|usage limit|rate limit'; then quota_wait "$result"; failures=0
    elif [ "$failures" -ge 3 ]; then log "backing off 15 minutes"; sleep 900; else sleep 60; fi
    continue
  fi
  failures=0
  log "upgrade batch $n: $(printf '%s' "$summary" | sed -n 's/.*"pending":\([0-9]*\),"accepted":\([0-9]*\),"rejected":\([0-9]*\),"draftedBy":"\([^"]*\)","reviewer":"\([^"]*\)".*/accepted=\2 rejected=\3 pending=\1 by=\4 review=\5/p')"
  n=$((n + 1))
  since_commit=$((since_commit + 1))
  if [ "$since_commit" -ge "$COMMIT_EVERY" ]; then commit_progress; fi
done
commit_progress
log "upgrade loop end"
