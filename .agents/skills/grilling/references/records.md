# Minimale Datensätze

Vorhandene Projektvorlagen haben Vorrang, sofern sie dieselben Nachweise erlauben.

## Themenindex

```markdown
# <Thema>
Session: active
Ziel / Nicht-Ziele:
Kontext: <Spec/Plan/Commit>
Bearbeiter:
| ID / Datei | Kurzfrage |
|---|---|
Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.
Nächste Runde / Forschungsblockade:
Zusammenfassung: <Link oder ausstehend>
Bestätigung: <tatsächliche Quelle oder ausstehend>
Chat-Runden (optional): <R-ID, Frage-ID/Version, tatsächliche Frage, Zustellung, Antwortverweise>
```

## Kanonische Frage

```markdown
---
id: Q-<eindeutig>
status: open
needs_review: false
depends_on: []
---
# <Frage>
Version: 1
Erstellt: <Datum>
Art: decision | fact
Priorität: blocking | important | later
Kontext / Quelle:
Anlass: <beobachtbare Lücke, Widerspruch oder Annahme>
Auswirkung / blockierte Arbeit:
Fragestellung:
Optionen und Folgen:
Empfehlung + sachlicher Grund:
Benötigter Sachbeleg: <Referenz oder keiner>

## Antworten
Noch keine. Empfehlung ist keine Antwort.
<!-- Bei Antwort ergänzen:
Antwort-ID: A-<eindeutig>
Zeit / beantwortet von / Quelle:
Bezug: Frageversion und Runde
Antwort: <wörtlich oder als sinngemäß markiert>
Ersetzt Antwort: <ID oder keine>
Konflikt mit: <Antwort-ID oder keiner>
Folgen / Rückfragen:
-->

## Verlauf
- <Zeit, Änderung, Grund, Quelle>
```

## Runde bei Tool-Zustellung

Für Chat-Runden genügt derselbe Nachweis kompakt im Themenindex; keine Extra-Datei nötig.

```markdown
# R-<eindeutig>
Status: prepared | sent | partial | answered | failed
Kontextversion:
Tool/Chat:
Mapping: <Tool-Feld-ID → Frage-ID + Version>
Gestellt: <tatsächlicher Wortlaut samt Optionen; keine Kopie privater Payloads>
Zustellung / Zeitpunkt: <bestätigt oder unbekannt>
Antwortquelle:
Ergebnis: <nur Verweise auf kanonische Antwort-IDs, offene IDs>
Fehler / Wiederaufnahme:
```

Empfehlungen bleiben vom tatsächlichen Antwortfeld getrennt. Referenzen und sachliche Entscheidungsgründe genügen; keine internen Gedankengänge festhalten.
