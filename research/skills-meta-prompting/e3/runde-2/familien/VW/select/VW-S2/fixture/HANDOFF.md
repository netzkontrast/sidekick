# Übergabe – Währungsspalte für Bestellungen

Stand: 2026-10-29, Branch feature/waehrung, Kopf c2

## Ziel
Die Tabelle `bestellungen` (rund 950 000 Zeilen) bekommt die Pflichtspalte
`waehrung`; der Altbestand wird mit 'EUR' befüllt. Produktion erst nach
einem erfolgreichen Lauf auf Staging.

## Erledigt
- Anforderungen mit der Fachseite geklärt (c1), Modell angepasst (c2).

## Nächster Schritt
- Migration 0017 schreiben und auf Staging ausführen.
