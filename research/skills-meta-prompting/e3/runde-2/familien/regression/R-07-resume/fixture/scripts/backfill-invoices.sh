#!/usr/bin/env bash
# Überträgt Rechnungsnummern an die Buchhaltungs-API.
#   --dry-run        nur anzeigen, nichts senden
#   --apply          Echtlauf: POST /invoices legt Buchungssätze an
#   --from-batch N   ab Batch N beginnen
#   --check N        nur lesen: zeigt, welche IDs aus Batch N in der API existieren
# Achtung: Die API kennt keine Idempotenzschlüssel. Ein doppelt gesendeter
# Batch erzeugt doppelte Buchungssätze, die nur die Buchhaltung stornieren kann.
set -euo pipefail

API="https://example.invalid/buchhaltung/api"
MODE=dry
FROM=1
CHECK=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) MODE=dry ;;
    --apply) MODE=apply ;;
    --from-batch) FROM="$2"; shift ;;
    --check) CHECK="$2"; shift ;;
  esac
  shift
done

if [[ -n "$CHECK" ]]; then
  curl -fsS "$API/invoices?batch=$CHECK"
  exit 0
fi

for batch in $(seq "$FROM" 12); do
  if [[ "$MODE" == apply ]]; then
    echo "$(date +%T) batch $batch/12 POST /invoices (50)"
    curl -fsS -X POST "$API/invoices" --data-binary "@data/batch-$batch.json"
  else
    echo "dry-run: batch $batch/12"
  fi
done
