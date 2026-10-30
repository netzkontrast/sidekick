---
id: Q-20261030-v0-lokal-offline
status: answered
needs_review: false
depends_on: []
---
# Darf die erste Version lokale Inferenz über den Connector und ein statisches Offline-Frontend vorsehen?
Version: 1
Erstellt: 2026-10-30
Art: decision
Priorität: blocking
Kontext / Quelle: [Vision v5 – Richtungsänderungen](../../../vision-v5-entwurf.md#richtungsänderungen-zur-v4-noch-zu-entscheiden), [Vision v4 §7 Nicht-Ziele](../../../vision.md#7-nicht-ziele-v1), [Machbarkeit – Offline](../../../research/vision-v5-machbarkeit.md#offline-und-gerätezugriff).
Anlass: v4 schließt eigenes Modell-Hosting aus, sieht lokale Modelle über den Connector aber bereits vor. Ein statisches Offline-Frontend ist neu und beeinflusst Speicher- und Sync-Verträge.
Auswirkung / blockierte Arbeit: Ob Geräte-Capability „lokale Inferenz“ und Offline-Entwurf/Sync-Status in die V0-Schemas gehören; Paket V2.
Fragestellung: Sollen die V0-Verträge lokale Inferenz als Gerätefähigkeit und ein statisches Offline-Frontend vorsehen? „Vorsehen“ heißt: im Vertrag modelliert, gebaut wird später.
Optionen und Folgen:
- A: Beides vorsehen. Gerätefähigkeiten und Offline-Entwürfe stehen im Schema; Bau ab V2/V4.
- B: Nur Offline-Frontend. Lokale Inferenz bleibt ein späterer Erweiterungspunkt.
- C: Nur lokale Inferenz. Frontend darf einen App-Server voraussetzen.
- D: Keines. V0 bleibt im v4-Rahmen.
Empfehlung + sachlicher Grund: A; beide ändern Verträge (Capabilities, Sync-Status, Konfliktfälle). Nachträgliches Einfügen wäre teurer als jetzt modellieren.
Benötigter Sachbeleg: keiner.

## Antworten
Antwort-ID: A-20261030-v0-lokal-offline
Zeit / beantwortet von / Quelle: 2026-10-30, Owner, AskUserQuestion in der Claude-Code-Session (Tool-Antwort ohne eigene Message-ID)
Bezug: Version 1, Runde R-20261030-v0-runde1
Antwort: „Beides vorsehen (Empfohlen)“ – Option A. (wörtlich gewählte Option)
Ersetzt Antwort: keine
Folgen / Rückfragen: In [V0-Spec](../../../spec/v0-ziel-und-vertraege.md) umgesetzt; Entscheidung als Vorschlag in den betroffenen Toren vermerkt.

## Verlauf
- 2026-10-30: Aus Bauauftrag V0 erfasst.
- 2026-10-30: Gestellt in R-20261030-v0-runde1 und beantwortet.
