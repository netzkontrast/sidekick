# sidekick – Agent Hub

> **Ein gemeinsamer Arbeitsraum für Menschen und ihre vorhandenen Agents – mit verbindlichen Aufträgen, kontrollierter Delegation und überprüfbaren Ergebnissen.**

**Status:** Vision (vor Spec) · private Instanz (self-hosted, Open Source) · erste Runtime: Claude Code

Die vollständige Vision steht in [`docs/vision.md`](docs/vision.md), die kritische Analyse samt Repo-Recherche und Übernahmeplan in [`docs/analyse-und-uebernahmeplan.md`](docs/analyse-und-uebernahmeplan.md). Dieses README fasst beides zusammen und beschreibt, wie im Repo gearbeitet wird.

---

## Warum

Agents laufen heute verstreut: Terminal-Sessions, Claude-App, Codex, lokale Modelle, Skripte. Kontext wird per Copy-Paste übertragen, Freigaben warten im Terminal, „fertig“ heißt nicht „richtig“, und Unterbrechungen kosten Fortschritt.

Chat-Apps lösen *Gespräche*, Coding-Harnesses lösen *Ausführung*. Es fehlt die Schicht dazwischen: **verbindliche Arbeit**. Was Ticketsystem plus CI für Entwicklerteams sind, soll der Agent Hub für gemischte Teams aus Menschen und Agents sein.

**Versprechen:** *Nachvollziehbare Wiederaufnahme* – Abläufe sind rekonstruierbar, Wirkungen passieren nicht doppelt, und jedes Ergebnis hat Belege.

## Nordstern-Ablauf (MVP)

1. Im Hub wird ein Änderungsauftrag angelegt.
2. Ein lokaler Coding-Agent (Claude Code) bearbeitet ihn in einem isolierten Git-Worktree, fragt bei Bedarf nach und fordert Freigaben an.
3. Automatische Checks laufen, ein zweiter Agent prüft den Diff.
4. Im Browser: Ergebnis, Befunde und offene Entscheidungen ansehen und annehmen.
5. Der Hub übernimmt die Änderung (PR/Merge).

## Kernbegriffe

| Begriff | Bedeutung |
|---|---|
| **Projekt** | Rahmen: Repos, Projektwissen, Policy (Datenklasse), Playbooks, Budget |
| **Auftrag** | Ziel, Abnahmekriterien, Eingaben, Befugnis, Budget, Frist; versioniert |
| **Playbook** | Deterministischer Ablauf aus Schritten für einen Auftragstyp |
| **Run** | Ein Ausführungsversuch eines Schritts (Bearbeiter × Runtime × Modell) |
| **Artefakt** | Versioniertes Ergebnis → Checks → Review → Abnahme → Übernahme |
| **Effekt** | Aktion mit Außenwirkung (Push, PR, Veröffentlichung) – idempotent, ggf. freigabepflichtig, vom Hub ausgeführt |
| **Befugnis** | Begrenzte Rechte; Delegation verkleinert nur |
| **Connector** | Lokaler Prozess, der Geräte und Runtimes anbindet |

## Leitprinzipien (Auswahl)

- **Delegation vor Chat** – der Hub verteilt und verfolgt Arbeit
- **Ein Vertrag für alle Bearbeiter** – Menschen und Agents nach denselben Regeln
- **Autonomie ist ein Regler** (L0–L4) pro Agent und Projekt
- **Außenwirkung über den Hub** – Agents *beantragen* Effekte, der Hub *führt sie aus*
- **Geliefert ≠ akzeptiert ≠ übernommen** – drei getrennte Schritte
- **Belege statt Behauptungen** – Unbelegtes wird markiert
- **Deterministisch steuern, intelligent arbeiten** – Playbooks, Zustand, Geld und Rechte sind Code
- **Provider-Terms-konform** – Abos nur über offizielle Clients
- **Spec-driven** – erst die Spec, dann der Code

## Nicht-Ziele (v1)

Kein weiterer Chat-Client · kein eigener Coding-Agent · kein Modell-Hosting · kein Proxy für Abo-Tokens · kein Marketplace · kein Multi-Tenant-Betrieb · kein Ersatz für Git/GitHub.

## Technischer Rahmen (vorläufig)

| Schicht | Wahl |
|---|---|
| Web + Hub-API | Next.js 16 + TypeScript, PWA |
| DB | Postgres (Neon) + Drizzle; Transactional Outbox; `SKIP LOCKED` + `claim_epoch` |
| Ablaufsteuerung | Playbook-Engine auf Vercel Workflow (hinter einem Interface) |
| Artefakte | S3-kompatibel (Vercel Blob), Content-Hash |
| Realtime | SSE mit Event-Cursor; WSS-Relay für Connectors |
| Auth | Better Auth, Kopplungscode für Geräte/Agents, OAuth/CIMD für Remote-MCP |
| Connector | Node-CLI `agent-hub-connector` mit ACP-Client |
| MCP | `@modelcontextprotocol/sdk`, stateless HTTP |

## Roadmap

| Phase | Ziel | Exit-Kriterium |
|---|---|---|
| **0a – Machbarkeit** | Bauen oder erweitern (Paperclip, OpenHands; Happy, Claude ACP als Referenz)? Siehe [Entscheidungstore A–D](docs/analyse-und-uebernahmeplan.md#6-rechercheverfahren-und-entscheidungstore) | Entscheidungsdokument |
| **0b – Spec** | Zustandsautomaten, Fehlerfälle, Domain Events, Playbook-Schema, Hub-API, MCP-Tools, Threat Model | Spec reviewt |
| **1 – Kern** | Nordstern-Ablauf | MVP-Abnahme inkl. Chaos-Tests grün |
| **2 – Breite** | Weitere Runtimes und Auftragstypen | 3 Runtimes, 3 Auftragstypen |
| **3 – Autonomie** | L1–L3, Delegation, Wettbewerbsmodus, Scorecards | Kette Coder → Tester → Reviewer |
| **4 – Komfort** | Hub-Assistenz, PWA + Push, Intake | Auftrag aus Issue, Freigabe vom Telefon |
| **5 – Cloud & Netz** | Hub-Runtime in der Sandbox, A2A | Externer A2A-Agent liefert ab |

Offene Entscheidungen sind in [`docs/vision.md` §26](docs/vision.md#26-offene-entscheidungen) gelistet.

---

## Repository

```
.
├── README.md         Überblick (diese Datei)
├── docs/
│   ├── vision.md                     Vollständige Produktvision (v4)
│   └── analyse-und-uebernahmeplan.md Visionsanalyse, Repo-Recherche, Entscheidungstore
└── .codegraph/       Lokaler CodeGraph-Index (nicht eingecheckt, nur .gitignore)
```

### CodeGraph

Das Repo ist für [CodeGraph](https://www.npmjs.com/package/@colbymchenry/codegraph) eingerichtet, damit Agents Code über einen Symbol-Graphen statt per grep erkunden. Die Datenbank ist lokal und wird nicht committet.

Index anlegen bzw. neu aufbauen:

```bash
codegraph init -y
```

Nach Änderungen synchronisieren:

```bash
codegraph sync
```

Code erkunden:

```bash
codegraph explore "<Symbolnamen oder Frage>"
```

Solange das Repo nur Markdown enthält, ist der Index leer; er füllt sich, sobald Quellcode hinzukommt.

## Mitarbeiten

Das Projekt ist *spec-driven*: Änderungen am Verhalten beginnen in der Spec (Phase 0b), erst danach folgt Code. Fragen und Vorschläge bitte als Issue.
