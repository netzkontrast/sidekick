# Übergabe – Vorschaubilder für die Mediathek

Stand: 2026-10-28, Branch feature/vorschau, Kopf c3

## Ziel
Vorschaubilder (320 px) für hochgeladene Fotos; Abruf p95 unter 300 ms.

## Erledigt
- Vorschau wird beim Upload mit bildmuehle 3.4 erzeugt (c2).
- Tests für die Vorschauerzeugung, 50 grün (c3).

## Verworfen
- Vorschau erst beim Abruf erzeugen: zu langsam, p95 2,4 s bei
  40-Megapixel-Fotos (Messung vom 2026-10-22, vor c1).

## Nächster Schritt
- Vorschauen cachen, damit wiederholte Abrufe nicht neu rechnen.
- Prüfen, ob bildmuehle 4 schneller skaliert.
