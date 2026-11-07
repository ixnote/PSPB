#!/bin/bash
# PSPBA Backup Script (NFR-R1: daily backups, 30-day retention)
# Usage: ./scripts/backup.sh
# Env: DATABASE_URL (required), BACKUP_DIR (default: ./backups), UPLOAD_DIR (optional)
# Loads backend/.env if DATABASE_URL is not already set.
# Schedule: add to cron for daily runs, e.g. 0 2 * * * /path/to/scripts/backup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Load backend/.env if DATABASE_URL not set
if [ -z "$DATABASE_URL" ] && [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  source "$ROOT_DIR/backend/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is required. Create backend/.env from backend/.env.example and set DATABASE_URL." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "Backing up database..."
pg_dump "$DATABASE_URL" | gzip -c > "$BACKUP_DIR/pspba-db-$TIMESTAMP.sql.gz"
echo "Database backup: pspba-db-$TIMESTAMP.sql.gz"

# Optionally backup uploads
if [ -n "$UPLOAD_DIR" ] && [ -d "$UPLOAD_DIR" ]; then
  echo "Backing up uploads..."
  tar -czf "$BACKUP_DIR/pspba-uploads-$TIMESTAMP.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>/dev/null || true
  echo "Uploads backup: pspba-uploads-$TIMESTAMP.tar.gz"
fi

# Prune backups older than RETENTION_DAYS
echo "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name 'pspba-*.sql.gz' -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name 'pspba-uploads-*.tar.gz' -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

echo "Backup complete."
