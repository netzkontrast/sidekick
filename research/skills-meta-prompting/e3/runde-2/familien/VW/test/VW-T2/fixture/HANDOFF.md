# Übergabe – Terminplanung über Zeitzonen

Stand: 2026-10-20, Branch feature/termine-tz, Kopf c4

## Ziel
Termine in der Zeitzone des Kunden anlegen und anzeigen, auch über
Sommerzeitwechsel hinweg.

## Erledigt
- Reproduktionstest für zeitwerk-tz #12: tests/dst.test.js (c2),
  mit 2.3 rot, deshalb als todo markiert.
- Umrechnung über eine eigene Offset-Tabelle umgesetzt (c4).

## Verworfen
- Bibliothek „zeitwerk-tz“ 2.3 (bei uns bisher nur für Formatierung):
  verschiebt Termine beim Sommerzeitwechsel um eine Stunde
  (Fehler #12 im Tracker von zeitwerk-tz, siehe tests/dst.test.js).

## Offen
- Die Offset-Tabelle muss bei jeder Regeländerung von Hand gepflegt werden.

## Nächster Schritt
- Offset-Tabelle für 2027 ergänzen.
