# Tor B: Claude-Anbindung

**Status:** offen · **Bezug:** [Analyse §6, Tor B](../analyse-und-uebernahmeplan.md#tor-b-claude-anbindung) · **Zeitbox:** 2–3 Tage (zusammen mit Tor A)

## Frage

Über welchen Weg bindet der Connector Claude Code an: [Claude ACP](https://github.com/agentclientprotocol/claude-agent-acp), Claude Agent SDK direkt oder die dokumentierte strukturierte CLI-Schnittstelle? Claude ACP nutzt selbst das Agent SDK; der Vergleich betrifft daher auch Abstraktion, Versionsrisiko und Funktionsabdeckung.

## Adapter-Matrix

| Fähigkeit | Claude ACP | Agent SDK | Strukturierte CLI |
|---|---|---|---|
| Unterstützter Auth-Pfad / Nutzungsbedingungen | | | |
| Streaming | | | |
| Rückfragen | | | |
| Permission-Details | | | |
| Abbruch | | | |
| Resume (`session/load` o. ä.) | | | |
| Modell-/Kostenmeldungen | | | |
| Custom Tools | | | |
| Arbeitsverzeichnis | | | |
| Versionsbindung | | | |
| Verhalten bei Crash | | | |

Jede Zelle mit Belegstatus: *dokumentiert*, *im Code gefunden*, *praktisch nachgewiesen* oder *offen*.

## Leitplanken

- Keine Abo-Tokens extrahieren oder an den Hub übertragen.
- Ein funktionierender Login beweist keine Berechtigung für jede Produktintegration.
- Ohne geeignete Credentials: Tests mit deterministischem Fake, Live-Auth ausdrücklich offen lassen.

## Befunde

## Entscheidung

## Offene Punkte

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md) (§4.6, §8): Der gewählte Adapter ersetzt die Fake-Runtime aus V0-ABL-01 und meldet sich als Capability der Art `runtime`. Lokale Modelle werden als Capability `local_model` modelliert ([A-20261030-v0-lokal-offline](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-lokal-offline.md)); ob dafür ein eigener Adapter nötig ist, bleibt offen.
