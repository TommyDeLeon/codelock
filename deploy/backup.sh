#!/bin/sh
# Nightly Postgres dump with retention.
#
# Runs as its own container in the compose stack rather than as a host cron
# job, so a fresh VPS needs no setup beyond `./deploy.sh` — and so the backup
# cannot be silently lost when someone rebuilds the box and forgets crontab.
#
# `--loop` sleeps until the next 03:00 UTC and repeats. One-shot without it,
# which is what restore drills and manual "before I do something stupid" dumps
# use.
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

dump() {
  mkdir -p "$BACKUP_DIR"
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  target="$BACKUP_DIR/codelock-$stamp.sql.gz"

  # Write to .partial first: a dump interrupted halfway through would otherwise
  # sit in the directory looking exactly like a good one, and you would find out
  # on the day you needed it.
  if pg_dump --no-owner --no-privileges | gzip -9 > "$target.partial"; then
    mv "$target.partial" "$target"
    echo "backup: wrote $target ($(wc -c < "$target") bytes)"
  else
    rm -f "$target.partial"
    echo "backup: FAILED at $stamp" >&2
    return 1
  fi

  # Prune only after a successful write, so a run of failures never leaves you
  # with nothing.
  find "$BACKUP_DIR" -name 'codelock-*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -print -delete
}

if [ "${1:-}" = '--loop' ]; then
  # Take one immediately so a new deployment is covered from minute one rather
  # than from the first 03:00 that happens to arrive.
  dump || true
  while true; do
    now=$(date -u +%s)
    next=$(( (now / 86400 + 1) * 86400 + 10800 ))
    sleep $(( next - now ))
    dump || true
  done
else
  dump
fi
