#!/usr/bin/env bash
# Run anchored authoring batches until the public index is exhausted.
#
# Each batch: Gemini drafts 6 originals anchored to the next uncovered index
# entries, Gemini repairs judge rejections once, Codex reads the admitted
# statements, the judge admits. Every COMMIT_EVERY batches the corpus is
# imported into the local database and committed. Failures back off and
# retry; nothing here needs a person present.
#
#   bash scripts/author-loop.sh [start-number] [anchors-path]
#
# Stop with: touch scripts/.author-stop
set -u
cd "$(dirname "$0")/.."

START=${1:-1}
ANCHORS=${2:-../../data/leetcode-index.json}
COMMIT_EVERY=5
LOG=scripts/author-loop.log
STOP=scripts/.author-stop

n=$START
since_commit=0
consecutive_failures=0

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

commit_progress() {
  LOG_LEVEL=silent npm run -s import:corpus >/dev/null 2>&1 || log "import:corpus failed (will retry next round)"
  ( cd ../.. && git add -A apps/api/src/corpus data/NOTICE >/dev/null 2>&1 && git commit -q -m "corpus" >/dev/null 2>&1 ) && log "committed" || log "nothing to commit"
  since_commit=0
}

log "loop start at gen-lc-$(printf '%03d' "$n")"
while true; do
  if [ -f "$STOP" ]; then log "stop file found; finishing"; break; fi
  out=$(printf 'gen-lc-%03d' "$n")
  log "batch $out"
  mkdir -p scripts/author-out
  result=$(LOG_LEVEL=silent npm run -s author:batch -- --anchors "$ANCHORS" --count 6 --out "$out" --codex 2>&1 \
    | grep -v "prisma:query\|DEP0190\|trace-deprecation" | tr '\r' '\n' | grep -v "waiting on\|judged [0-9]")
  # Full per-batch output kept, so a zero-yield batch can be read afterwards.
  printf '%s\n' "$result" > "scripts/author-out/$out.log"
  summary=$(printf '%s\n' "$result" | grep -E '^\{"mode"' | tail -1)
  if printf '%s\n' "$result" | grep -q "every anchor in the index is covered"; then
    log "index exhausted"; break
  fi
  if [ -z "$summary" ]; then
    consecutive_failures=$((consecutive_failures + 1))
    log "batch $out produced no summary (failure $consecutive_failures): $(printf '%s\n' "$result" | grep -iE 'error|limit|quota|judge' | head -2 | cut -c1-200)"
    if [ "$consecutive_failures" -ge 3 ]; then log "backing off 15 minutes"; sleep 900; else sleep 60; fi
    continue
  fi
  consecutive_failures=0
  accepted=$(printf '%s' "$summary" | sed -n 's/.*"accepted":\([0-9]*\).*/\1/p')
  rejected=$(printf '%s' "$summary" | sed -n 's/.*"rejected":\([0-9]*\).*/\1/p')
  codex=$(printf '%s' "$summary" | sed -n 's/.*"codex":"\([^"]*\)".*/\1/p' | cut -c1-40)
  log "batch $out: accepted=$accepted rejected=$rejected codex=$codex"
  printf '%s\n' "$result" | grep -E '^    [a-z0-9-]+: ' | grep -v ': OK$' | head -6 | while read -r l; do log "codex note: $l"; done
  n=$((n + 1))
  since_commit=$((since_commit + 1))
  if [ "$since_commit" -ge "$COMMIT_EVERY" ]; then commit_progress; fi
done
commit_progress
log "loop end at gen-lc-$(printf '%03d' "$n")"
