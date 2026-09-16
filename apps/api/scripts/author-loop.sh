#!/usr/bin/env bash
# Run anchored authoring batches until the public index is exhausted.
#
# Each batch: Gemini drafts 6 originals anchored to the next uncovered index
# entries, Gemini repairs judge rejections once, Codex reads the admitted
# statements, the judge admits. Every COMMIT_EVERY batches the corpus is
# imported into the local database and committed. Failures back off and
# retry; nothing here needs a person present.
#
#   bash scripts/author-loop.sh [start-number] [anchors-path] [shard k/N]
#
# Several workers run side by side with different shards (0/3, 1/3, 2/3):
# each owns a disjoint slice of the index, batch files are named per worker,
# and the shared corpus files and the git commit are taken under a lock.
#
# Stop all workers with: touch scripts/.author-stop
set -u
cd "$(dirname "$0")/.."

START=${1:-1}
ANCHORS=${2:-../../data/leetcode-index.json}
SHARD=${3:-0/1}
MODEL=${4:-gemini-3.1-pro-low}
WORKER=${SHARD%%/*}

# On a quota error, wait for the window to reset rather than switch model:
# the error names the reset ("Resets in 9m17s"); otherwise wait 15 minutes.
quota_wait() {
  local mins
  # "Resets in 1h36m40s" or "Resets in 9m17s": hours and minutes both count.
  local h m
  h=$(printf '%s' "$1" | sed -n 's/.*[Rr]esets in \([0-9]*\)h.*/\1/p' | head -1)
  m=$(printf '%s' "$1" | sed -n 's/.*[Rr]esets in \([0-9]*h\)\{0,1\}\([0-9]*\)m.*/\2/p' | head -1)
  mins=$(( ${h:-0} * 60 + ${m:-0} ))
  [ "$mins" -eq 0 ] && mins=""
  if [ -n "$mins" ]; then log "quota reached; waiting $((mins + 1)) minutes for the reset"; sleep $(( (mins + 1) * 60 ));
  else log "quota reached; waiting 15 minutes"; sleep 900; fi
}
COMMIT_EVERY=5
LOG=scripts/author-loop.log
STOP=scripts/.author-stop
GITLOCK=scripts/.author-gitlock

n=$START
since_commit=0
consecutive_failures=0

log() { printf '%s [w%s] %s\n' "$(date -u +%FT%TZ)" "$WORKER" "$*" | tee -a "$LOG"; }

# mkdir is atomic, so one worker imports and commits at a time.
commit_progress() {
  local waited=0
  until mkdir "$GITLOCK" 2>/dev/null; do
    sleep 5; waited=$((waited + 5))
    if [ "$waited" -ge 600 ]; then log "git lock stuck; skipping this commit"; since_commit=0; return; fi
  done
  LOG_LEVEL=silent npm run -s import:corpus >/dev/null 2>&1 || log "import:corpus failed (will retry next round)"
  ( cd ../.. && git add -A apps/api/src/corpus data/NOTICE >/dev/null 2>&1 && git commit -q -m "corpus" >/dev/null 2>&1 ) && log "committed" || log "nothing to commit"
  rmdir "$GITLOCK" 2>/dev/null
  since_commit=0
}

log "loop start at gen-lc-$(printf '%03d' "$n")"
while true; do
  if [ -f "$STOP" ]; then log "stop file found; finishing"; break; fi
  if [ "$SHARD" = "0/1" ]; then out=$(printf 'gen-lc-%03d' "$n"); else out=$(printf 'gen-lc-w%s-%03d' "$WORKER" "$n"); fi
  log "batch $out"
  mkdir -p scripts/author-out
  result=$(LOG_LEVEL=silent npm run -s author:batch -- --anchors "$ANCHORS" --count 6 --out "$out" --shard "$SHARD" --model "$MODEL" --codex 2>&1 \
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
    if printf '%s\n' "$result" | grep -qiE 'quota|usage limit|rate limit'; then quota_wait "$result"; consecutive_failures=0
    elif [ "$consecutive_failures" -ge 3 ]; then log "backing off 15 minutes"; sleep 900; else sleep 60; fi
    continue
  fi
  consecutive_failures=0
  accepted=$(printf '%s' "$summary" | sed -n 's/.*"accepted":\([0-9]*\).*/\1/p')
  rejected=$(printf '%s' "$summary" | sed -n 's/.*"rejected":\([0-9]*\).*/\1/p')
  codex=$(printf '%s' "$summary" | sed -n 's/.*"codex":"\([^"]*\)".*/\1/p' | cut -c1-40)
  log "batch $out: accepted=$accepted rejected=$rejected codex=$codex"
  # Nobody could read the statements: wait for a reviewer rather than draft again.
  if printf '%s' "$summary" | grep -q '"unreviewed"'; then log "no reviewer available; waiting 15 minutes"; sleep 900; continue; fi
  printf '%s\n' "$result" | grep -E '^    [a-z0-9-]+: ' | grep -v ': OK$' | head -6 | while read -r l; do log "codex note: $l"; done
  n=$((n + 1))
  since_commit=$((since_commit + 1))
  if [ "$since_commit" -ge "$COMMIT_EVERY" ]; then commit_progress; fi
done
commit_progress
log "loop end at gen-lc-$(printf '%03d' "$n")"
