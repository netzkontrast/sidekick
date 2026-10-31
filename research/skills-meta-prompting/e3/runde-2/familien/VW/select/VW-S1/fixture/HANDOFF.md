# Übergabe – Suche im Doku-Portal

Stand: 2026-10-17, Branch feature/suche, Kopf c4

## Ziel
Volltextsuche über alle Seiten des Doku-Portals (rund 20 000 Seiten),
Antwortzeit unter 200 ms pro Anfrage.

## Erledigt
- Eigener invertierter Index als JSON-Datei, entsteht beim Build (c3).
- Suche im Portal an den Index angebunden (c4).

## Verworfen
- Externer Suchdienst „sucharium“: Inhalte dürfen das Haus nicht
  verlassen (docs/vorgaben.md, Abschnitt Datenschutz).
- Eingebetteter Volltextindex „liteindex“: läuft erst ab Node 20,
  unsere Server laufen auf Node 18.

## Stand
- Der Eigenbau funktioniert, ist aber zu langsam: 1,8 s pro Anfrage
  bei 20 000 Seiten.

## Nächster Schritt
- Indexformat optimieren (z. B. Präfixbaum), danach erneut messen.
