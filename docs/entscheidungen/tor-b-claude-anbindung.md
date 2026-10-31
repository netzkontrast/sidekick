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

- Aus der Skill-Library-Recherche, 30.10.2026 ([C0/E1-Ergebnis](../../research/skills-meta-prompting/eval-runs/C0-E1-ergebnis-2026-10-30.md)), nur für die strukturierte CLI (`claude -p`, headless, OAuth-Abo, ein Modell): Projekt-Skills werden gefunden, und ihr Aufruf erscheint als eigenes Werkzeugereignis in der Spur; Usage-Felder werden geliefert (*praktisch nachgewiesen*). Ein AskUser-Werkzeug fehlt headless (*praktisch nachgewiesen*); Rückfragen brauchen dort einen anderen Kanal. Das füllt keine Zelle der Matrix; Agent SDK und ACP sind dazu *offen*.
- Vergleichsmuster für die strukturierte CLI, 31.10.2026 ([Dossier afs-spec](../research/dossiers/afs-spec.md#adaptervertrag-der-coding-delegation-7)): Die Agent-Formation-Spec beschreibt einen deklarativen Adapter für Claude Code im Print-Modus mit JSON-Stream, Prompt über stdin und Session-Paar aus Anlegen und Fortsetzen. Sie kennt kein Freigabe-Primitiv und reicht Rechte-Flags ungeprüft durch (*dokumentiert*, nicht praktisch geprüft). Grundlage für die eigene Adapter-Spec; füllt ebenfalls keine Matrixzelle.

## Entscheidung

## Offene Punkte

- Offen, 30.10.2026: Den [frühen Needle-Versuch N0](../claude-startauftrag-vision-v5.md) und lokale ASR-/Inferenzdienste als zusätzliche Gerätefähigkeiten prüfen. Lokale Modelle über den Connector waren bereits in v4 vorgesehen; neu sind insbesondere Training/Fine-Tuning und der konkretisierte Betrieb. Die Claude-Anbindung bleibt der bestehende P0-Vergleich.

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md) (§4.6, §8): Der gewählte Adapter ersetzt die Fake-Runtime aus V0-ABL-01 und meldet sich als Capability der Art `runtime`. Lokale Modelle werden als Capability `local_model` modelliert ([A-20261030-v0-lokal-offline](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-lokal-offline.md)); ob dafür ein eigener Adapter nötig ist, bleibt offen.
