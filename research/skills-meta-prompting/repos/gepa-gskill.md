# Dossier: GEPA / gskill

| Feld | Wert |
|---|---|
| URL | https://github.com/gepa-ai/gepa |
| Commit-SHA | `02ea4152ff6e512484cb5298046bfe967aea4735` |
| Release / Datum | Gelesener Quellstand vom 30.10.2026; keine installierte Version |
| Lizenz(en), Notices, Assets | Root-LICENSE: MIT, Copyright 2025 Lakshya A Agrawal; Datensätze, abhängige Pakete und Container separat zu prüfen |
| Priorität / Tor | SL1-Gegenprüfung, später SL4/SL5; keine P0-Hub-Entscheidung |
| Geprüft am / von | 30.10.2026 / eigenständige Primärquellenrecherche |

## Startanleitung

**Dokumentiert, nicht ausgeführt:** Die [Anleitung](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/docs/docs/guides/gskill.md) beschreibt zusätzliche Python-Pakete, Docker, Modellzugang und SWE-smith-Aufgaben. Das ist kein leichtgewichtiger Nur-Markdown-Versuch. Ein Start in Sidekick benötigt zuerst Dependency-Entscheidung, zulässige Daten, isolierte Ausführung und Budget. Kein Installationsbefehl wurde hier ausgeführt.

## Öffentliche Verträge

**Dokumentiert:** Ein Evaluator liefert einen numerischen Wert und Diagnoseinformationen; ein Vorschlagsmodell kann Textkandidaten verändern. Optimierbarer Text ist vom Evaluationssystem getrennt. Die CLI-Proposer-Anleitung ist eine Integrationsskizze, keine autoritative Aussage zu Provider-Nutzungsbedingungen.

**Im Code gefunden:** [Optimierungsskript](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/src/gepa/gskill/gskill/train_optimize_anything.py#L719) übergibt Trainingsdaten und Validierungsdaten getrennt an `optimize_anything`. Ein gesonderter [Claude-Evaluator](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/src/gepa/gskill/gskill/evaluate/claude_code_skills.py#L58) verpackt Text als SKILL.md. Das beweist keine tatsächlich beobachtete Skill-Aktivierung.

## Persistenz

**Im Code gefunden:** Das Trainingsskript schreibt Konfiguration, Ergebnisdaten und den besten Text in ein Ausgabeverzeichnis; Resume wird dokumentiert. **Offen:** Abgleich nach Abbruch mitten in einem Rollout, atomare Artefaktübernahme, reproduzierbare externe Datenrevision und Konsistenz bei mehreren Schreibern. Sidekick muss eigene Artefakthashes und Aktivierungstore verwenden.

## Credential-Fluss

Die Dokumentation setzt Modellzugang und optionale externe Trackingdienste voraus. Credential-Speicherung und tatsächliche Egress-Grenzen wurden nicht praktisch geprüft. Vorgeschlagene Sidekick-Grenze: autorisierter Optimierungsworker, keine Weitergabe lokaler Abo-Tokens an den Hub und keine unredigierten Sessions an externe Evaluatoren.

## Sicherheitsgrenzen

Docker wird als Ausführungsumgebung beschrieben, aber weder ein kontrollierter Demo-Container noch eine geeignete Isolationsgrenze wurden hier nachgewiesen. Skilltext darf keine Rechte vergeben. Der fremde Demo-Code wird nicht übernommen; eigene Input-/Outputverträge und Tests bleiben maßgeblich.

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Netzwerkunterbrechung | Kein Versuch; Verhalten im Sidekick-Adapter zu spezifizieren | offen |
| Prozess-/Connector-Neustart | Resume dokumentiert; Abbruchgrenzen nicht getestet | dokumentiert / offen |
| Doppelte Zustellung | Keine Sidekick-Idempotenzgarantie nachgewiesen | offen |
| Rechteentzug | Keine Sidekick-Fencing-/Widerrufsprüfung ausgeführt | offen |

## Tests

| Test | Ergebnis | Belegpfad |
|---|---|---|
| Quelllektüre von Datenaufteilung und Optimiereraufruf | Separate Mengen und Adapteraufruf im Code gefunden | Trainingsskript am genannten Commit |
| Formatierung für Claude-Skills | Code gelesen, nicht ausgeführt | Claude-Evaluator am genannten Commit |
| Smoke-Test / echter Lernvergleich | Nicht ausgeführt | kein Laufartefakt |
| Transfer auf deutsche Sidekick-Aufgaben | Nicht ausgeführt | kein Laufartefakt |

## Bewertung für den Hub

**Kategorie: als späteren Optimierungsadapter evaluieren; keine Dependency ausgewählt.** Interessant ist das Verhalten „Ausführungsfeedback erzeugt geprüften Textkandidaten“, nicht eine zweite Auftragsengine. Ein einfacher manueller/regelbasierter Kandidat ist die erste Vergleichsbasis. Fremder Prompttext und Code wurden nicht portiert.

## Offene Punkte

Aufgabenfamilien gegen Split-Lecks prüfen; deutsche Tool-/Interviewfälle statt Coding-Benchmarks; effektive Modell-/CLI-Versionen; tatsächliche Kosten je Kandidat einschließlich Judge und Wiederholungen; Rohdatenzugriff, Löschung und Rücknahme. Ein Blog widerspricht sich bei einzelnen Ergebniszahlen zwischen Text und Bildbeschriftung; daraus werden keine Sidekick-Zielwerte abgeleitet.

Einordnung und konkrete Änderungen am SL1-Design: [Primärquellenprüfung](../../../docs/research/skill-library-primaerquellen-2026-10-30.md).
