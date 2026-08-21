#!/usr/bin/env bash
# Restore a dump produced by backup.sh.
#
# This exists to be *run*, not to be read. A backup nobody has restored is a
# rumour about a backup, so DEPLOY.md asks you to do a drill once before you
# rely on any of it.
#
#   ./restore.sh --list
#   ./restore.sh codelock-20260822T030000Z.sql.gz
#   ./restore.sh --latest
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose"

usage() {
  cat >&2 <<'EOF'
usage: ./restore.sh [--list | --latest | <dump-file>]

  --list     show the dumps currently held
  --latest   restore the newest dump
  <file>     restore a specific dump, by the name --list prints

The restore DROPS AND RECREATES the database. Everything currently in it is
gone. You will be asked to confirm.
EOF
  exit 1
}

list_dumps() {
  # -T so compose does not allocate a TTY and consume this script's stdin.
  # Without it the confirmation prompt further down reads EOF and the restore
  # silently does nothing, which is a memorable way to discover your backups.
  $COMPOSE run --rm -T --no-deps --entrypoint sh backup \
    -c 'ls -1t /backups/codelock-*.sql.gz 2>/dev/null | xargs -r -n1 basename' \
    </dev/null
}

[ $# -eq 1 ] || usage

case "$1" in
  --list)
    list_dumps
    exit 0
    ;;
  --latest)
    target=$(list_dumps | head -n1)
    [ -n "$target" ] || { echo "no dumps found" >&2; exit 1; }
    ;;
  -h | --help)
    usage
    ;;
  *)
    target="$1"
    ;;
esac

echo "About to restore: $target"
echo "This DROPS the current database. Type the word 'restore' to continue."
read -r confirm
[ "$confirm" = 'restore' ] || { echo "aborted"; exit 1; }

# Stop the API first. Restoring under a live connection pool leaves the app
# holding handles to tables that are being dropped, and the errors that produces
# are far more confusing than the outage.
echo "stopping api..."
$COMPOSE stop api

echo "restoring..."
$COMPOSE exec -T postgres sh -c '
  set -e
  psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);"
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"
'

$COMPOSE run --rm -T --no-deps --entrypoint sh backup \
  -c "gunzip -c /backups/$target | psql -q"

echo "starting api..."
$COMPOSE start api

echo
echo "Restored $target."
echo "The API runs 'prisma migrate deploy' at boot, so a dump from an older"
echo "schema is migrated forward automatically. Check 'docker compose logs api'."
