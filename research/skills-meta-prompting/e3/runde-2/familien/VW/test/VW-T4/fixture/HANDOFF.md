# Übergabe – Monatsberichte im CI

Stand: 2026-10-27, Branch feature/berichte, Kopf c2

## Ziel
Die Monatsberichte für alle rund 1 200 Kunden entstehen im CI-Job
`berichte`; Laufzeit unter 15 Minuten.

## Erledigt
- Berichtsvorlage und Summenseite (c1), CI-Job eingerichtet (c2).

## Verworfen
- Berichte parallel in Worker-Threads erzeugen: Der CI-Runner hat nur
  1 vCPU (ci/runner.yml), gemessen ohne Gewinn (44 statt 43 min).

## Nächster Schritt
- Laufzeit senken; Engpass ist die PDF-Erzeugung je Kunde.
