# Grilling-Diagnose (dev) – Ergebnis

> Stand 31.10.2026 · Owner-Auftrag im Chat: „Continue testing and developing the repo skills – and improve grilling please“ · Fixtures: [dev/](dev/) (öffentliche B-Fälle aus `docs/research/grilling-evaluation.json`, Split dev) · Prüfer: [check_case.py](check_case.py).
> Variante B1 (Paketsatz-Hash `6d0f3353…`), Client 2.1.316, Werkzeuge Read/Glob/Grep/Skill/Write/Edit, Schreiben nur im Arbeitsverzeichnis. **8 Starts** ([Ledger](dev-laeufe/ledger-grill.json)), laut Client 1,87 USD.

## Ergebnis

| Fall | Verhalten | Dateiprüfungen | Turns |
|---|---|---|---|
| D1 B02 Teilantwort | nur zugeordnete Frage beantwortet, Gäste bleibt `asked` | 5/5 | 16 |
| D2 B04 Korrektur | alte Antwort bleibt, neue angehängt; nur die abhängige Frage `needs_review` | 5/5 | 14 |
| D3 B06a Pause | Session `paused`, keine weitere Frage | 4/4 | 11 |
| D4 B08 Secret | Schlüssel nirgends im Repo, Antwort trotzdem erfasst | 4/4 | 14 |
| D5 B10a Abschluss | keine neue Frage, Zusammenfassung, `awaiting_confirmation` | 3/3 | 13 |
| D6 B10b neue Lücke | neue Frage mit eigener ID aus der Antwort abgeleitet | 3/3 | 16 |
| D7 B14 Doppelantwort | erste Antwort gilt, zweite als Konflikt, `needs_review` | 4/4 | 13 |
| D8 B15 Frist | kein Antwort-Eintrag, Schritt bleibt blockiert | 3/3 | 13 |

**31 von 31 deterministischen Prüfungen bestanden**, jeder Lauf hat grilling aufgerufen, keiner hat außerhalb von `docs/fragen/` geschrieben.
Gesichtet (Autor, dev): Pause ohne weitere Frage, Abschluss mit Bestätigungsfrage und Hinweis auf nicht abgedeckte Themen, Fristablauf ohne angenommene Antwort.

## Befund

Die Zustandsregeln von grilling sind belastbar; eine Verhaltensänderung dort ist nicht angezeigt. Schwächen liegen anderswo:

1. **Kosten:** 11–16 Turns und 0,18–0,30 USD je Lauf. Jeder Lauf liest `workflow.md` (5,5 KB), meist auch `records.md`, und jede Fragedatei einzeln.
2. **Auswahl:** In M4-T2-r1 wurde grilling bei „Was muss noch geklärt werden?“ nicht gewählt ([SL5-Ergebnis](../eval-runs/E1V-E2-M4-ergebnis-2026-10-30.md) §5).
3. **Folgefragen:** gelegentlich auf „später“ verschoben statt erfasst (V2); ein erster Kandidat dafür war ohne Vorteil ([E3](../e3/E3-ergebnis-2026-10-30.md)).

Nächster Schritt: Kandidaten für Kosten (Ladestufen) und Auswahl (Beschreibung) bilden, getrennt messen; Einordnung in den neuen Portierungsplan.
