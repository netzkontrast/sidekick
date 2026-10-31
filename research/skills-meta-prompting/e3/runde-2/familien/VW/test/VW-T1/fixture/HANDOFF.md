# Übergabe – PDF-Export für Rechnungen

Stand: 2026-10-24, Branch feature/rechnung-pdf, Kopf c3

## Ziel
Rechnungen als PDF exportieren. Der Export läuft auch in den
On-Prem-Installationen bei unseren Kunden.

## Erledigt
- HTML-Vorlage für Rechnungen (c2).
- Datenaufbereitung für die Vorlage inklusive Tests (c3).

## Nächster Schritt
- PDF-Erzeugung mit der Bibliothek „seitenguss“ einbauen
  (src/export/pdf.js), danach Tests für Seitenumbrüche.
