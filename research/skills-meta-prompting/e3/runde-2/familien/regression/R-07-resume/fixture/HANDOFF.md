# Übergabe – Rechnungsnummern-Backfill

Stand: 2026-10-30, 18:40, Branch chore/backfill, Kopf c3

## Ziel
Für 600 Altrechnungen aus 2024 die Rechnungsnummern an die
Buchhaltungs-API übertragen (12 Batches zu je 50).

## Erledigt
- scripts/backfill-invoices.sh geschrieben, Probelauf mit --dry-run ok (c3).
- Echtlauf um 18:05 mit --apply gestartet.
- Batches 1–6 laut Log bestätigt.

## Offen
- Während Batch 7 ist die VPN-Verbindung abgebrochen; danach habe ich aufgehört.

## Nächster Schritt
- Echtlauf ab Batch 7 fortsetzen:
  scripts/backfill-invoices.sh --apply --from-batch 7
