# Tor B: Claude-Anbindung

**Status:** offen · **Bezug:** [Analyse §6, Tor B](../analyse-und-uebernahmeplan.md#tor-b-claude-anbindung) · **Zeitbox:** 2–3 Tage (zusammen mit Tor A)

## Frage

Über welchen Weg bindet der Connector Claude Code an: [Claude ACP](https://github.com/agentclientprotocol/claude-agent-acp), Claude Agent SDK direkt oder die dokumentierte strukturierte CLI-Schnittstelle? Claude ACP nutzt selbst das Agent SDK; der Vergleich betrifft daher auch Abstraktion, Versionsrisiko und Funktionsabdeckung.

**Vorentscheidung (30.10.2026):** Claude Code ist die erste Runtime, auch für den Test des Adaptervertrags (siehe [Grundsatzentscheidungen](README.md#grundsatzentscheidungen-des-owners)). Offen bleibt hier nur der Anbindungsweg. Weil keine zweite Runtime die Vertragstests absichert, braucht Tor B früh eine deterministische Fake-Runtime.

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

- Offen, 30.10.2026: Den [frühen Needle-Versuch N0](../claude-startauftrag-vision-v5.md) und lokale ASR-/Inferenzdienste als zusätzliche Gerätefähigkeiten prüfen. Lokale Modelle über den Connector waren bereits in v4 vorgesehen; neu sind insbesondere Training/Fine-Tuning und der konkretisierte Betrieb. Die Claude-Anbindung bleibt der bestehende P0-Vergleich.
