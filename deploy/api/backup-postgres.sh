#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_BUCKET:?BACKUP_BUCKET is required, for example gs://kyndill-db-backups}"
: "${DATABASE_URL:?DATABASE_URL is required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="/tmp/kyndill-${timestamp}.dump"

pg_dump --format=custom --no-owner --no-acl --file="${backup_file}" "${DATABASE_URL}"
gcloud storage cp "${backup_file}" "${BACKUP_BUCKET}/kyndill-${timestamp}.dump"
rm -f "${backup_file}"
