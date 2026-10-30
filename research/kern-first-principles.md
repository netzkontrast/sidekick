# Was ist der Kern von Sidekick? – First-Principles-Reduktion

Stand 2026-10-30. Diskussionspapier, keine Entscheidung. Grundlage: [Vision](../docs/vision.md),
[Analyse](../docs/analyse-und-uebernahmeplan.md), [Skills-/Meta-Prompting-Recherche](skills-meta-prompting/README.md).
Die Vision bleibt unverändert. Was hier vorgeschlagen wird, geht erst über `docs/entscheidungen/` in die Spec.

## These

> **Sidekick ist ein Journal verbindlicher Zusagen zwischen einem Menschen und seinen Bearbeitern.**
> Es hält fest, wer was mit welchen Rechten und welchem Budget tun darf, was tatsächlich passiert ist,
> und welche Folge aufgrund welcher Belege zugelassen wurde.

Alles andere ist eine Ansicht dieses Journals, ein Adapter daran oder ein Verbraucher davon:
- Ansichten: Inbox, Board, Ampel, Scorecards
- Adapter: Runtimes, Connector, GitHub, Push
- Verbraucher: Playbooks, Skills, Hub-Assistenz

## 1. Zerlegung: Was ist an „verbindlicher Arbeit“ unverzichtbar?

Die Vision nennt das Problem: Chat löst Gespräche, Harnesses lösen Ausführung, und dazwischen fehlt verbindliche Arbeit.
Auf ihre Grundbestandteile zurückgeführt braucht Vertrauen in delegierte Arbeit genau drei Dinge:

| # | Grundwahrheit | Warum unverzichtbar | Ohne sie |
|---|---|---|---|
| 1 | **Eine ausdrückliche Zusage.** Ziel, Abnahmekriterien, Rechte und Budget stehen fest, bevor gearbeitet wird. | Ohne Zusage gibt es keinen Maßstab für „richtig“ und keine Grenze für „erlaubt“. | „Fertig“ heißt nicht „richtig“; Rechte entstehen implizit. |
| 2 | **Eine wahrheitsgetreue Aufzeichnung.** Was passiert ist, steht unveränderlich in einem Journal. Der Zustand wird daraus abgeleitet. | Wiederaufnahme, Doppel-Erkennung, Fencing, Kosten und Belege setzen eine einzige Wahrheit voraus. | Fortschritt geht verloren oder entsteht doppelt; Kosten und Belege sind Behauptungen. |
| 3 | **Ein Tor vor jeder Folge.** Außenwirkung, Abnahme und Übernahme passieren erst nach einer gebundenen Entscheidung. | Agents sind nicht zurechnungsfähig; eine Folge muss jemandem zugerechnet werden, der dafür einsteht. | Freigaben warten im Terminal oder werden umgangen. |

Gegenprobe, was davon nur Konvention ist und weg kann:

| Bestandteil | Physik oder Konvention? |
|---|---|
| Web-UI, Board, Ampel | Konvention. Das sind Ansichten; eine CLI- oder Mobile-Ansicht wäre gleichwertig. |
| Playbooks | Halb. Sie sind Daten über Zusagen: eine Folge von Schritten mit Toren. Eine eigene Engine sind sie nicht. |
| Workflow-Engine | Konvention. Sie organisiert Warten und Wiederholen. Die fachliche Wahrheit liegt im Journal (Analyse §3). |
| Scorecards, Wettbewerb | Abgeleitet. Sie werden aus Journal und Checks berechnet. |
| Hub-Assistenz | Ein Verbraucher, der nur Kandidaten erzeugt. Die gehen durch dieselben Tore. |
| Autonomie-Stufen L0–L4 | Voreinstellungen für Zusagen und Tore. Wirksame Rechte kommen immer aus Grants (Analyse §3). |
| Skills und Prompts | Artefakte. Sie werden wie Code geändert: als Kandidat, durch die Tore, dann übernommen. |

## 2. Drei Kerne, drei Invarianten

| Kern | Invariante | Deckt diese Vision-Prinzipien ab (§6) |
|---|---|---|
| **Vertrag** (Auftrag, Befugnis, Budget, Datenklasse; versioniert) | *I1: Nichts geschieht ohne Vertrag. Rechte entstehen nur aus Befugnis, und Delegation verkleinert nur.* | Rechte nur aus Befugnis · Identität aus Authentifizierung · Delegation verkleinert nur · Datenklasse vor Bequemlichkeit · Ein Vertrag für alle Bearbeiter |
| **Journal** (append-only Events; Zustand, Kosten und Belege daraus abgeleitet) | *I2: Was nicht im Journal steht, ist nicht passiert. Was unklar ist, steht als „Ausgang unklar“ darin.* | Belege statt Behauptungen · Ehrliche Zuverlässigkeit und Kosten · Nachvollziehbare Wiederaufnahme · Portabel bleiben |
| **Tor** (Check, Review, Freigabe; gebunden an Aktion, Parameter-Hash und Epoch) | *I3: Jede Folge passiert ein Tor. Ändert sich ihr Inhalt, braucht es ein neues Tor.* | Außenwirkung über den Hub · Freigaben sind aktionsgebunden · Geliefert ≠ akzeptiert ≠ übernommen · Vorschlagen, nicht handeln |

Die übrigen Prinzipien („Delegation vor Chat“, „Deterministisch steuern, intelligent arbeiten“, „Spec-driven“,
„Provider-Terms-konform“) beschreiben, *wie* die drei Kerne gebaut und angebunden werden. Eigene Kerne sind sie nicht.

## 3. Alternativen, die geprüft wurden

Kandidaten für „den Kern“, erst gesammelt, dann bewertet:

| Kandidat | Was er wäre | Bewertung |
|---|---|---|
| A. Ticket-Hub wie in der Vision | Aufträge, Board, Playbooks, Runtimes | Richtig, aber zu breit als Kern. Er enthält die drei Kerne plus viele Ansichten. |
| B. Effekt-Gateway | Nur das Tor vor Außenwirkung | Zu schmal. Ohne Vertrag gibt es keinen Maßstab, ohne Journal keine Wiederaufnahme. |
| C. Flugschreiber | Nur das Journal von Agent-Läufen | Zu passiv. Er beobachtet, kann aber nichts verhindern. |
| D. Skill-/Prompt-Plattform | Die Bausteine K1–K7 der Recherche | Ein Verbraucher, kein Kern (siehe §5). |
| E. Entscheidungs-Inbox | Freigaben und Rückfragen über Agents hinweg, auch mobil | Das stärkste *Erlebnis*. Sie ist aber eine Ansicht auf Tore. |
| F. Agent-Vergleich | Scorecards aus der eigenen Arbeit | Wird aus Journal und Checks abgeleitet. |
| G. Weglassen | Nur Konventionen: AGENTS.md, GitHub-Issues, PR-Reviews | **Die ernsthafteste Konkurrenz**, siehe §4. |

Ergebnis: Der Kern ist **Vertrag + Journal + Tor** (B + C + Maßstab). Das erste *Erlebnis* darauf ist **E**.

## 4. Provokation: Was kann Sidekick, was GitHub + Claude Code nicht können?

GitHub bietet bereits eine Art Vertrag (Issue), ein Journal (Timeline) und Tore (Required Checks, Reviews).
Dieses Repo arbeitet in Phase 0 genau so. Damit Sidekick sich lohnt, braucht es einen Unterschied, der sich nicht wegdiskutieren lässt:

1. **Tore *vor* der Folge, nicht erst beim Merge.** GitHub prüft am Ende. Ein Agent mit Shell und Token hat dann
   schon gepusht, veröffentlicht oder gelöscht. Sidekick bindet die Freigabe an die konkrete Aktion, bevor sie passiert.
2. **Wiederaufnahme über Geräte und Runtimes.** Fencing und „Ausgang unklar“ betreffen lokale Agent-Läufe.
   Davon weiß GitHub nichts.
3. **Abnahme mit Belegen auch ohne Code.** Recherche, Text, Analyse und Skills sollen nach denselben Regeln abgenommen werden.

Erfüllt ein Feature keinen dieser drei Punkte, gehört es in eine Ansicht oder einen Adapter und nicht in den Kern.
Das ist eine nützliche Entscheidungsregel für die Spec.

## 5. Einordnung der Skills-/Meta-Prompting-Recherche

Die [Synthese](skills-meta-prompting/synthese.md) fällt in diese Struktur, statt ein zweites Produkt zu werden:

| Baustein der Recherche | Gehört zu |
|---|---|
| K6 Änderungspipeline (Kandidat → Inventar → Tore → Apply/Restore) | **Tor** (I3), angewendet auf Skill-Artefakte |
| K5 Evaluation (Splits, Rohergebnisse, Rubrik) | **Tor**: Das sind Checks. Die Rohergebnisse sind Belege im **Journal** |
| K7 Kosten und Budgets | Budget im **Vertrag**, gemessene Usage im **Journal** |
| K8 Harness-Grenzen | **Vertrag** (Befugnis) und **Tor** (Effekt-Freigabe) zur Laufzeit |
| K1–K4 Skill-Format, Technik-Katalog, Templates, Kontext-Builder | **Ausstattung der Bearbeiter**: Damit entstehen Kontextpakete. Diese Schicht ist ein Adapter, kein Kern |

Folgerung: Ein „Skill ändern“-Auftrag ist ein Playbook wie „Code ändern“. Dabei verbessert Sidekick die Skills seiner
eigenen Bearbeiter durch die eigenen Tore. Das ist Dogfooding ohne zusätzliche Kernmechanik.

## 6. Architektur-Skizze (Ports und Adapter)

```text
                 Ansichten: Inbox (Tore) · Board/Ampel · Auftrag · Scorecards · CLI/MCP
                                          │ lesen
┌──────────────────────────────── Kern (transaktional) ─────────────────────────────────┐
│  Vertrag ──────────────► Journal (append-only) ◄────────────── Tor                    │
│  Auftrag, Befugnis,      Events, Effekte, Belege,             Policy-Auswertung,      │
│  Budget, Datenklasse     Usage; Zustand abgeleitet            Freigabe@Hash+Epoch,    │
│  (versioniert)           (Projektionen)                       Check-/Review-Ergebnis  │
└───────▲────────────────────────▲─────────────────────────────────────▲────────────────┘
        │ Commands (idempotent)  │ Events                              │ Anfragen / Entscheidungen
   Ports:                        │                                     │
   Runtime ── Claude Code (Hooks/MCP) · Codex · Mensch                  │
   Effekt  ── GitHub (Push/PR) · Dateisystem · Veröffentlichung ────────┘ nur nach Tor
   Check   ── Tests/Lint · Eval-Harness (K5) · Review-Agent
   Kontext ── Skill-/Prompt-Ausstattung (K1–K4) · Projektwissen
   Melder  ── Push · Digest
   Takt    ── Workflow-Engine (Warten, Wiederholen; ruft nur Commands)
```

Regeln für die Spec:
- Nur der Kern schreibt ins Journal, und zwar transaktional. Adapter schicken Commands und lesen Projektionen.
- Jeder Command ist idempotent und trägt die Version von Vertrag und Epoch.
- Ein Effekt-Adapter führt nur aus, wenn ein Tor-Ereignis mit passendem Hash vorliegt.
- Playbooks, Autonomie-Presets und Skills sind *Daten*, die der Kern interpretiert, kein Code im Kern.

## 7. Riskanteste Annahme und billigster Test

**Annahme:** Für *eine* Person mit mehreren Agents lohnt sich der Mehraufwand für Vertrag und Tor gegenüber
„einfach in Claude Code arbeiten und am Ende den PR prüfen“.

Wenn sie falsch ist, wird der Hub zur Bürokratie und bleibt ungenutzt.

**Billigster Test, ohne Code:**
- Eine Woche lang echte Aufträge so führen:
  - Vertrag als Markdown-Datei mit Kriterien, Befugnis und Budget;
  - Journal als Datei, an die nur angehängt wird;
  - Tore als ausdrückliche Freigaben vor Push oder Veröffentlichung.
- Zählen:
  - Wie oft hätte ein Tor *vor* der Folge etwas verhindert, das GitHub erst beim Merge sieht?
  - Wie oft ging nach einer Unterbrechung Arbeit verloren oder wurde doppelt gemacht?
  - Wie viele Minuten Bedienlast kostet das pro Auftrag?

**Option für die erste Version, nicht entschieden:** „Skill ändern“ oder „Recherche“ als erstes Playbook statt
„Code ändern“. Die Außenwirkung ist kleiner, und Tore und Belege lassen sich trotzdem voll testen. Der Nordstern
bliebe Code. Diese Frage gehört zu Tor A/B.

## 8. Bewusst zurückgestellt

- Hub-Assistenz, Wettbewerbsmodus, Scorecards, A2A, Multi-Tenant: alles Verbraucher oder Ansichten. Sie kommen nach dem Kern.
- Eine eigene „Meta-Prompting-Engine“: Die Konzepte gehen als Kontext-Adapter und Eval-Checks ein (siehe §5).

## Offene Fragen an den Owner

1. Trägt die These aus dem Satz oben? Oder fehlt ein Bestandteil, der für dich unverzichtbar ist?
2. Welcher der drei Unterschiede zu GitHub + Claude Code (§4) ist dir am wichtigsten? Davon hängt ab, welches Tor zuerst gebaut wird.
3. Soll der Wochentest aus §7 vor Tor A laufen?
