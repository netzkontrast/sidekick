---
id: Q-20261030-v0-erster-auftrag
status: answered
needs_review: false
depends_on: []
---
# Welcher durchgängige Auftrag liefert zuerst Nutzen?
Version: 1
Erstellt: 2026-10-30
Art: decision
Priorität: blocking
Kontext / Quelle: [Bauauftrag – erster Ablauf](../../../claude-startauftrag-vision-v5.md#der-erste-durchgängige-ablauf), [Analyse §9](../../../analyse-und-uebernahmeplan.md#9-umfang-und-reihenfolge), [Kern §7](../../../../research/kern-first-principles.md#7-riskanteste-annahme-und-billigster-test).
Anlass: Analyse §9 legt den MVP auf `code-change` mit PR als Effekt fest. Bauauftrag und Kern §7 schlagen Recherche als ersten Ablauf vor.
Auswirkung / blockierte Arbeit: Erster Auftragstyp, Effektkatalog und Abnahmekriterien in V0/V1.
Fragestellung: Recherche mit Artefakt oder kleine Codeänderung als erster durchgängiger Auftrag?
Optionen und Folgen:
- A: Recherche mit Artefakt. Kleinere Außenwirkung, Tore und Belege voll testbar; PR als Effekt folgt als zweiter Typ. Weicht von Analyse §9 ab.
- B: Kleine Codeänderung. Entspricht Analyse §9 und Nordstern; PR-Erstellung als einziger externer Effekt von Anfang an.
Empfehlung + sachlicher Grund: A für V1 mit Fake-Runtime; `code-change` bleibt Nordstern für Tor A. Der Effektpfad lässt sich mit einem kontrollierten Fake-Effekt prüfen.
Benötigter Sachbeleg: keiner.

## Antworten
Antwort-ID: A-20261030-v0-erster-auftrag
Zeit / beantwortet von / Quelle: 2026-10-30, Owner, AskUserQuestion in der Claude-Code-Session (Tool-Antwort ohne eigene Message-ID)
Bezug: Version 1, Runde R-20261030-v0-runde1
Antwort: „Recherche + Artefakt (Empfohlen)“ – Option A. (wörtlich gewählte Option)
Ersetzt Antwort: keine
Folgen / Rückfragen: In [V0-Spec](../../../spec/v0-ziel-und-vertraege.md) umgesetzt; Entscheidung als Vorschlag in den betroffenen Toren vermerkt.

## Verlauf
- 2026-10-30: Aus Bauauftrag V0 erfasst.
- 2026-10-30: Gestellt in R-20261030-v0-runde1 und beantwortet.
