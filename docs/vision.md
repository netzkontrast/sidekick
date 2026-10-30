# Agent Hub – Vision

> Arbeitstitel: **Agent Hub** · Stand: 30.10.2026 · Version 4 · Status: Vision (vor Spec)
> Entschieden: **private Instanz** (self-hosted, Open Source) · **erste Runtime: Claude Code**
> Neu in v4: Problem, Szenarien, Produkterlebnis, Nicht-Ziele, Playbooks & Checks, Belege, Abnahme ≠ Übernahme, Außenwirkung über den Hub, Autonomie-Stufen, Datenklassen, Menschen als Bearbeiter, Claude-/ChatGPT-App als MCP-Client, Hub-Assistenz, Scorecards & Wettbewerbsmodus, Erfolgsmetriken, Risiken, Domain Events.

**Inhalt**
A. Produkt: 1 Problem · 2 Vision · 3 Einsatzfelder · 4 Szenarien · 5 Produkterlebnis · 6 Leitprinzipien · 7 Nicht-Ziele
B. Domäne: 8 Domänenmodell · 9 Auftrag & Lebenszyklus · 10 Playbooks & Checks · 11 Autonomie & Befugnisse · 12 Kontext, Wissen & Datenklassen
C. Fähigkeiten: 13 Anbindung · 14 Kosten · 15 Hub-Assistenz · 16 Intake & Benachrichtigungen · 17 Observability & Scorecards · 18 Ausbaustufen
D. Umsetzung: 19 Bauen oder erweitern · 20 Technik · 21 Datenmodell · 22 Domain Events · 23 Erfolgsmessung · 24 Risiken · 25 Roadmap · 26 Offene Entscheidungen

---

# A. Produkt

## 1. Problem

| Heute | Folge |
|---|---|
| Agents laufen verstreut: Terminal-Sessions, Claude-App, Codex, lokale Modelle, Skripte | Niemand weiß, was gerade wo läuft |
| Kontext wird per Copy-Paste übertragen | Jeder Agent startet bei null oder mit viel zu viel |
| Freigaben warten im Terminal | Arbeit steht still, sobald man nicht am Rechner sitzt |
| „Fertig“ heißt nicht „richtig“ | Ergebnisse müssen mühsam nachgeprüft werden |
| Laptop zu, Netz weg, Limit erreicht | Fortschritt geht verloren oder entsteht doppelt |
| Kein Vergleich zwischen Agents und Modellen | Die Wahl beruht auf Bauchgefühl statt auf der eigenen Arbeit |

Chat-Apps lösen *Gespräche*, Coding-Harnesses lösen *Ausführung*. Es fehlt die Schicht dazwischen: **verbindliche Arbeit**.

## 2. Vision

**Ein gemeinsamer Arbeitsraum für Menschen und ihre vorhandenen Agents – mit verbindlichen Aufträgen, kontrollierter Delegation und überprüfbaren Ergebnissen.**

- **Analogie:** Was Ticketsystem plus CI für Entwicklerteams sind, ist der Agent Hub für gemischte Teams aus Menschen und Agents.
- **Alleinstellungsmerkmal:** Ein Auftrag bleibt über Geräte, Agent-Systeme und Unterbrechungen hinweg verständlich und überprüfbar.
- **Versprechen:** *Nachvollziehbare Wiederaufnahme*. Abläufe sind rekonstruierbar, Wirkungen passieren nicht doppelt, und jedes Ergebnis hat Belege.

### Nordstern-Ablauf (MVP)

> Ich lege im Hub einen Änderungsauftrag an. Mein lokaler Coding-Agent (Claude Code) bearbeitet ihn in einem isolierten Git-Worktree, fragt bei Bedarf nach und fordert Freigaben an. Automatische Checks laufen, ein zweiter Agent prüft den Diff. Im Browser sehe ich Ergebnis, Befunde und offene Entscheidungen, nehme an, und der Hub übernimmt die Änderung (PR/Merge).

## 3. Einsatzfelder

**Primär:** eine Person mit mehreren Agent-Systemen (private Instanz). **Später:** kleine Teams.

| Auftragstyp | Typisches Artefakt | Typische Checks |
|---|---|---|
| **Code-Änderung** | Diff / PR | Tests, Build, Lint, Pfadregeln, Diff-Größe, Review |
| **Recherche** | Bericht mit Quellen | Quellen erreichbar, Aussagen belegt, Review |
| **Text & Lektorat** | Dokument + verankerte Kommentare | Stilregeln, Konsistenz mit Projektwissen, Review |
| **Review / Audit** | Befundliste mit Schweregrad | Vollständigkeit gegen Checkliste |
| **Daten & Analyse** | Tabelle, Diagramm, Skript | Reproduzierbarkeit (Skript läuft erneut) |
| **Wartung** (wiederkehrend) | Update-PR, Statusbericht | Tests, Changelog |

## 4. Szenarien

| # | Szenario | Was passiert |
|---|---|---|
| S1 | **Bugfix delegieren** | Siehe Nordstern-Ablauf |
| S2 | **Laufende Session einbeziehen** | In einer offenen Claude-Code-Session: „Hol dir Auftrag 42.“ Die Session holt sich den Kontext per MCP, arbeitet und reicht den Diff ein. |
| S3 | **Aus der Claude-App beauftragen** | In der Claude-App (Remote-MCP-Connector): „Leg einen Recherche-Auftrag zu X an, Abnahme durch mich.“ Das Abo bleibt in Anthropics eigener App und ist damit terms-konform. |
| S4 | **Unterwegs freigeben** | Push-Nachricht: „Freigabe nötig: Push auf `fix/42` (3 Dateien, Tests grün)“. Ein Tipp gibt frei, der Run läuft weiter. |
| S5 | **Wettbewerb** | Derselbe Auftrag geht parallel an Claude Code und Codex. Diffs, Checks, Kosten und Dauer werden nebeneinander verglichen, der Nutzer wählt einen aus, die Scorecards aktualisieren sich. |
| S6 | **Recherche wird Wissen** | Ein Bericht mit Belegen geht in die Prüfung. Ausgewählte Aussagen werden zu verifiziertem Projektwissen, das künftige Aufträge automatisch erhalten. |
| S7 | **Lektorat** | Ein Lektor-Agent kommentiert einzelne Absätze. Ich übernehme Vorschläge einzeln oder lehne sie mit Begründung ab. |
| S8 | **Störung** | Laptop mitten im Run zugeklappt: Die Ampel zeigt 🔴 „Gerät offline, Run pausiert“. Beim Aufklappen geht es am Cursor weiter, nichts passiert doppelt. |

## 5. Produkterlebnis

### Bildschirme

| Bildschirm | Zweck | Kerninhalt |
|---|---|---|
| **Heute** (Entscheidungs-Inbox) | Was braucht *mich*? | Wartende Freigaben, Rückfragen und Abnahmen, sortiert nach Blockadewirkung; Bündel-Freigabe |
| **Aufträge** | Überblick | Board nach Ampel-Status, Filter nach Projekt, Bearbeiter und Typ |
| **Auftrag** | Alles zu einem Auftrag | Ziel, Kriterien, Befugnis, Budget · Timeline (Zusammenfassung → Events) · Artefakte mit Diff- und Dokumentansicht · Entscheidungen |
| **Projekt** | Rahmen | Repos, Projektwissen (verifiziert/Entwurf), Playbooks, Datenklasse, Budget, Agent-Pool |
| **Agents & Geräte** | Wer kann arbeiten? | Online-Status, Kapazität, Autonomie-Stufe, Scorecards |
| **Neuer Auftrag** | Gut beauftragen | Freitext → Assistent entwirft Kriterien, Playbook und Bearbeiter → bestätigen |

### Interaktionsprinzipien

- **„Worauf wartet das?“** Jede Wartesituation beantwortet zwei Fragen: worauf, und was passiert, wenn ich nichts tue.
- **Entscheidungen mit Kontext:** Jede Entscheidung zeigt, was genau freigegeben wird, eine Empfehlung und die Folgen. Gleichartige Freigaben lassen sich bündeln.
- **Erzählung vor Rohdaten:** Die Timeline startet als Zusammenfassung von 3 Sätzen, Events öffnen sich auf Klick.
- **Verankerte Kommentare** an Diff-Zeilen und Absätzen, für Menschen und Agents gleichermaßen.
- **Geringe Bedienlast:** gute Defaults, Vorlagen, Tastaturbedienung, Entscheidungen auch mobil.
- **Eskalation statt Dauerping:** Nur Blockierendes meldet sich sofort, alles andere kommt im Digest.

**Status-Ampel** (aus Auftrag, Run und Verbindung abgeleitet):

| Ampel | Bedeutung |
|---|---|
| 🟢 | Arbeitet |
| 🟡 | Wartet auf dich |
| 🔵 | Ergebnis zur Prüfung |
| ⚪ | Wartet auf Agent oder Gerät |
| 🔴 | Gestört / Ausgang unklar |
| ✅ | Abgeschlossen |

## 6. Leitprinzipien

| Prinzip | Bedeutung |
|---|---|
| **Delegation vor Chat** | Der Hub verteilt und verfolgt Arbeit; Chat ist nur eine Oberfläche dafür |
| **Ein Vertrag für alle Bearbeiter** | Menschen und Agents übernehmen Aufträge nach denselben Regeln |
| **Rechte nur aus Befugnis** | Selbstregistrierung legt nur ein Profil an; Rechte vergibt der Owner |
| **Identität aus der Authentifizierung** | Niemals per `agent_id`-Parameter |
| **Autonomie ist ein Regler** | Pro Agent und Projekt einstellbar (L0–L4), nicht ein- oder ausgeschaltet |
| **Delegation verkleinert nur** | Ein Unterauftrag hat höchstens die Rechte des Delegierenden |
| **Außenwirkung über den Hub** | Agents *beantragen* Effekte (Push, PR, Veröffentlichung); Hub oder Connector *führen sie aus*, mit Idempotenz und Freigabe |
| **Freigaben sind aktionsgebunden** | Gebunden an Aktion und Parameter-Hash; ändert sich der Inhalt, braucht es eine neue Freigabe |
| **Geliefert ≠ akzeptiert ≠ übernommen** | Drei getrennte Schritte |
| **Belege statt Behauptungen** | Fortschritt und Ergebnisse verweisen auf Belege; Unbelegtes wird markiert |
| **Deterministisch steuern, intelligent arbeiten** | Playbooks, Zustand, Geld und Rechte sind Code; Agents entscheiden über den Inhalt |
| **Zweckgebundener Kontext** | Kontextpakete statt Verläufen; Agent-Aussagen werden erst nach Prüfung zu Wissen |
| **Datenklasse vor Bequemlichkeit** | Die Projekt-Policy bestimmt, welche Runtimes und Provider Kontext sehen dürfen |
| **Ehrliche Zuverlässigkeit und Kosten** | Fencing, „Ausgang unklar“; Kosten getrennt nach gemessen, reserviert, geschätzt und unbekannt |
| **Vorschlagen, nicht handeln** | Die Hub-Assistenz schlägt vor, der Mensch bestätigt |
| **Portabel bleiben** | Standard-Postgres, S3-kompatibler Speicher, Workflow-Engine hinter einer Schnittstelle, Export aller Daten |
| **Provider-Terms-konform** | Abos nur über offizielle Clients der Anbieter |
| **Spec-driven** | Erst die Spec, dann der Code (GSD) |

## 7. Nicht-Ziele (v1)

- ❌ Kein weiterer Chat-Client als Kernprodukt
- ❌ Kein eigener Coding-Agent im MVP; vorhandene Runtimes werden genutzt
- ❌ Kein eigenes Modell-Hosting
- ❌ Kein Proxy für Abo-Tokens, keine Login-Weitergabe
- ❌ Kein öffentliches Agent-Netzwerk, kein Marketplace
- ❌ Kein Multi-Tenant-Betrieb
- ❌ Keine Selbstorganisation ohne Befugnis und Limits
- ❌ Kein Ersatz für Git oder GitHub; Git bleibt die Quelle der Wahrheit für Code

---

# B. Domäne

## 8. Domänenmodell

```
Workspace
 ├─ Projekt ─ Repos · Projektwissen · Policy (Datenklasse) · Playbooks · Budget · Agent-Pool
 │   └─ Auftrag (versioniert) ─ Vertrag · Befugnis · Kettenlimits
 │       ├─ Schritt (aus Playbook)
 │       │   └─ Run = Bearbeiter × Runtime × Modell
 │       │       ├─ Events · Effekte · Freigaben · Rückfragen
 │       │       └─ Artefakt → Checks → Review → Abnahme → Übernahme
 │       └─ Unteraufträge (verkleinerte Befugnis)
 ├─ Bearbeiter ─ Menschen · Agents (Definition + Runtime-Bindungen)
 └─ Geräte (Connector) ─ Runtimes
```

| Begriff | Bedeutung |
|---|---|
| **Projekt** | Rahmen für Aufträge: Repos, Wissen, Policy, Playbooks, Budget |
| **Auftrag** | Ziel, Abnahmekriterien, Eingaben, Befugnis, Budget, Frist; versioniert |
| **Playbook** | Deterministischer Ablauf aus Schritten für einen Auftragstyp |
| **Schritt** | Teil eines Playbooks (z. B. implementieren, prüfen, reviewen, übernehmen) |
| **Run** | Ein Ausführungsversuch eines Schritts |
| **Bearbeiter** | Mensch oder Agent, der einen Schritt übernimmt |
| **Agent-Definition** | Rolle, Anweisungen, Skills, Befugnis-Vorlage, Autonomie-Stufe; runtime-unabhängig |
| **Runtime-Bindung** | Ordnet eine Agent-Definition einer Runtime und einem Modell zu (z. B. „Coder“ → Claude Code / Sonnet) |
| **Runtime** | Führt aus: Claude Code, Codex, Goose, Cloud-Sandbox, A2A-Dienst |
| **Connector** | Lokaler Prozess für Geräte und Runtimes; verwaltet, denkt aber nicht selbst |
| **Artefakt** | Versioniertes Ergebnis (Diff, Dokument, Befunde, Datei) |
| **Check** | Automatische oder manuelle Prüfung gegen ein Abnahmekriterium |
| **Beleg** | Nachweis zu einer Aussage (Testausgabe, Befehlslog, Quelle mit Zitat, Screenshot) |
| **Effekt** | Aktion mit Außenwirkung, idempotent und gegebenenfalls freigabepflichtig |
| **Befugnis** | Begrenzte Rechte, vom Owner vergeben oder durch Delegation verkleinert |
| **Policy / Datenklasse** | Regel, wohin Projektkontext darf |

## 9. Auftrag & Lebenszyklus

### 9.1 Auftragsvertrag

- [ ] Ziel und **Abnahmekriterien** (prüfbar, mit Checks verknüpft)
- [ ] **Versionierte Eingaben** und **Ausgangszustand** (z. B. Repo + Commit-SHA)
- [ ] **Playbook** (Typ + Version) und **Datenklasse** (vom Projekt geerbt)
- [ ] Verantwortlicher Owner; Bearbeiter pro Schritt
- [ ] **Befugnis:** Aktionen, Pfade, Repos, Netzwerk; Kostenrahmen; Frist
- [ ] **Limits:** Nacharbeitsrunden, Kettentiefe, parallele Runs, Wiederholungen
- [ ] Event-Log, Rückfragen, Entscheidungen, Artefakte

### 9.2 Drei getrennte Zustandsautomaten

| Automat | Zustände |
|---|---|
| **Auftrag** | `draft · open · in_progress · waiting_input · waiting_approval · submitted · checking · in_review · accepted · applying · completed · rework · outcome_unknown · cancelled · failed` |
| **Run** | `starting · running · paused · cancel_requested · cancel_confirmed · exited_ok · exited_error · lost` |
| **Verbindung** | `online · degraded · offline · revoked` |

Ein Auftrag kann auf Prüfung warten, während sein Agent offline ist. Ein Connector kann online sein, obwohl der Prozess abgestürzt ist. Ein sauber beendeter Run kann ein unbrauchbares Ergebnis liefern. Deshalb sind die drei Automaten getrennt.

### 9.3 Fehlerfälle

| Fehlerfall | Verbindliches Verhalten |
|---|---|
| Doppelte Zustellung | Nur eine gültige Übernahme; jede Operation hat einen Idempotenz-Key |
| Alter Agent arbeitet nach Neuvergabe weiter | Fencing: `claim_epoch` steigt, veraltete Einreichungen werden abgewiesen |
| Verbindungsabbruch | Ergebnis bleibt erhalten; Fortsetzung am Event-Cursor; der Connector liefert Events nach |
| Effekt ausgeführt, Bestätigung verloren | `effect_intent` → `effect_done`; ist ein Intent offen, folgt `outcome_unknown` → abgleichen → ggf. wiederholen |
| Rechte widerrufen | Neue Aktionen werden abgewiesen; laufende Effekte werden abgeglichen |
| Auftrag während eines Runs geändert | Neue Auftragsversion; der laufende Run bleibt an die alte gebunden → `waiting_input` oder neuer Run |
| Parallele Aufträge auf derselben Ressource | Leases auf Branch und Pfade; Konfliktprüfung gegen den aktuellen Stand vor der Übernahme |
| Bearbeiter reagiert nicht | Frist → Erinnerung → Neuvergabe (Fencing) oder Eskalation |
| Abbruch angefordert | `cancel_requested` und `cancel_confirmed` werden getrennt angezeigt |
| Lease abgelaufen | Stoppt keinen fremden Prozess, entwertet aber dessen Ergebnisse |

**Grenze:** Ohne Idempotenz-Unterstützung des externen Dienstes gibt es keine Garantie für einmalige Wirkung, auch nicht mit einem durablen Workflow. Der Hub zeigt das offen an, statt es zu verstecken.

### 9.4 Nacharbeit

Eine Ablehnung (durch Check, Review oder Mensch) erzeugt **strukturiertes Feedback**. Der nächste Run erhält ein **Übergabepaket** aus vorherigem Artefakt, Feedback und Befunden. Nach dem Nacharbeitslimit wird an den Owner eskaliert.

### 9.5 Abnahme ≠ Übernahme

**Abnahme** bestätigt, dass das Ergebnis die Kriterien erfüllt. **Übernahme** wendet es an: Merge, Veröffentlichung, Export nach Notion oder Drive. Die Übernahme ist ein eigener **Effekt**, den der Hub ausführt, mit Idempotenz, Konfliktprüfung gegen den aktuellen Ausgangsstand und je nach Policy einer Freigabe.

## 10. Playbooks & Checks

**Skills** beschreiben, *wie ein Agent* eine Arbeit erledigt; das ist Know-how im Kontext. **Playbooks** beschreiben, *wie der Hub* einen Auftrag steuert; das ist ein deterministischer Ablauf.

```yaml
playbook: code-change@1
inputs: { repo: required, base_ref: required }
steps:
  - id: implement
    assignee: { role: coder }
    produces: diff
    skills: [repo-conventions]
  - id: checks
    run: [tests, lint, path_rules, diff_size]
    on_fail: rework(implement)
  - id: review
    assignee: { role: reviewer, not_same_as: implement }
    produces: findings
    on_changes_requested: rework(implement)
  - id: accept
    by: owner                # alternativ: rule (z. B. checks grün + review approved)
  - id: apply
    effect: github.open_pr   # oder github.merge_pr
    approval: policy
limits: { rework: 3, cost_eur: 5, duration: 2h }
```

**Prüfstufen:**

| Stufe | Wer prüft | Beispiele |
|---|---|---|
| 1 – Deterministisch | Code | Tests, Build, Lint, Schema, Pfadregeln, Diff-Größe, Quellen erreichbar, Skript reproduzierbar |
| 2 – Agent-Review | Review-Agent (≠ Bearbeiter) | Rubrik, Befunde mit Schweregrad und Fundstelle |
| 3 – Mensch | Owner bzw. Mitglied | Abnahme |

- **Regel:** Ein Agent-Urteil allein reicht nie für eine Übernahme mit Außenwirkung, es sei denn, die Policy erlaubt es ausdrücklich.
- **Belege:** `report_progress` und `submit` verweisen auf Belege. Aussagen ohne Beleg erscheinen in der UI als *unbelegt*.
- **Standard-Playbooks:** `code-change`, `research-report`, `text-edit`, `review-only`, `recurring-maintenance`.
- **Wettbewerb:** Ein Schritt kann mit `parallel: 2` an mehrere Bindungen gehen; der Mensch wählt das bessere Artefakt.

## 11. Autonomie & Befugnisse

### 11.1 Autonomie-Stufen (pro Agent × Projekt)

| Stufe | Agent darf … | Beispiel |
|---|---|---|
| **L0** | nur zugewiesene Aufträge ausführen | Neuer, ungeprüfter Agent |
| **L1** | zusätzlich Aufträge und Wissen *vorschlagen* | „Ich habe einen weiteren Bug gefunden“ |
| **L2** | passende offene Aufträge selbst übernehmen | Coder zieht sich Tasks aus dem Projekt-Pool |
| **L3** | Unteraufträge delegieren (verkleinerte Befugnis, Limits) | Coder beauftragt einen Test-Agent |
| **L4** | Playbooks und Skills vorschlagen; per Regel abnehmen, wo die Policy es erlaubt | Bewährter Wartungs-Agent |

Damit wird die ursprüngliche Idee der Selbstorganisation zum **Regler, der mit nachgewiesenem Vertrauen steigt**. Die Scorecards liefern die Grundlage, die Entscheidung trifft immer der Owner.

### 11.2 Registrierung (einheitlich für Geräte und Agents)

```
register (MCP/REST) ─▶ Kopplungscode ─▶ Owner bestätigt in der UI
   ─▶ wählt Agent-Definition, Befugnis-Vorlage, Autonomie-Stufe ─▶ Token (gehasht gespeichert)
```

Getrennt geführt werden: Identität · behauptete Fähigkeiten · nachgewiesene Fähigkeiten (aus akzeptierten Aufträgen) · Befugnis.

### 11.3 Befugnisse & Freigaben

- [ ] Delegation verkleinert nur (`parent_grant_id`); Kettenlimits für Kosten, Tiefe, Parallelität und Wiederholungen
- [ ] Freigabe = Aktion + Parameter-Hash + Gültigkeit; die UI zeigt genau das Freigegebene
- [ ] Freigabe-Regeln pro Projekt (z. B. „Push auf Feature-Branches frei, Merge nur nach Freigabe“)
- [ ] Widerruf wirkt sofort auf neue Aktionen

### 11.4 Rollen

| Rolle | Darf | Darf nicht |
|---|---|---|
| **Owner** | Befugnisse, Policies, Budgets, Freigaben, Abnahme | – |
| **Mitglied** | Aufträge anlegen und bearbeiten, gemäß Regel abnehmen | Befugnisse anderer ändern |
| **Agent** | Gemäß Autonomie-Stufe arbeiten, vorschlagen, delegieren | Sich Rechte geben, Secrets lesen, eigene Ergebnisse abnehmen |
| **Beobachter** | Lesen | Schreiben |

**Grundfragen:**
- **Delegieren:** Menschen immer, Agents ab L3.
- **Bezahlen:** Das reservierte Auftragsbudget, abgezogen vom Owner.
- **Widersprüche:** Entscheiden die Kriterien, sonst ein Mensch.
- **Fertig:** Erst bei `completed`, also nach der Übernahme.

## 12. Kontext, Wissen & Datenklassen

### 12.1 Drei Ebenen

| Ebene | Inhalt | Schreibregel |
|---|---|---|
| **Projektwissen** | Freigegebene Fakten, Ziele, Entscheidungen, Konventionen | Versioniert; verbindlich erst nach Prüfung (`knowledge.propose` → Review) |
| **Auftragskontext** | Quellen, Ausgangsversionen, Skills | Pro Run als Snapshot eingefroren |
| **Arbeitsnotizen** | Hypothesen, Entwürfe, Agent-Berichte | Immer als vorläufig markiert |

**Kontextpaket pro Run:** Ziel und Kriterien · relevante *verifizierte* Wissenseinträge · Eingangsversionen · Skills des Schritts · Feedback aus der Nacharbeit, mit Größenbudget. Ein früher Fehler wird so nicht zur „gemeinsamen Erinnerung“ aller Agents.

### 12.2 Datenklassen (Projekt-Policy)

| Klasse | Erlaubte Runtimes und Provider | Beispiel |
|---|---|---|
| `public` | Alle | Open-Source-Repo |
| `internal` | Alle verbundenen Provider mit gültigem Vertrag | Eigene Projekte |
| `confidential` | Nur freigegebene Provider, keine Trainingsnutzung, kein Teilen | Kundendaten |
| `local-only` | Nur Connector-Runtimes mit lokalen Modellen; kein Cloud-Kontext | Persönliches, Gesundheitsdaten |

- [ ] Der Hub erzwingt die Klasse beim Zuweisen und beim Packen des Kontexts, nicht der Agent.
- [ ] **Secrets** landen nie im Kontext. Effekte mit Credentials führt der Hub bzw. der Connector aus.

---

# C. Fähigkeiten

## 13. Anbindung

### 13.1 Drei Arten der Zusammenarbeit

| Situation | Technisch nötig | Adapter |
|---|---|---|
| Laufenden Agent einbeziehen | Agent ruft Hub-Werkzeuge auf | MCP-Server des Hubs |
| Vorhandenen Agent gezielt starten | Connector steuert eine Runtime | Connector + ACP/SDK |
| Eigenständigen Agent-Dienst beauftragen | Remote-Delegation | A2A |

### 13.2 Rollen der Protokolle

| Schnittstelle | Rolle | Grenze |
|---|---|---|
| **MCP** | Zugriff auf Projekte, Aufträge, Wissen und Artefakte | Macht keinen Agent dauerhaft aktiv |
| **ACP – Agent Client Protocol** (Zed) | Connector ↔ Coding-Agent-Sitzung | Nicht verwechseln mit dem archivierten BeeAI-„Agent Communication Protocol“ |
| **A2A** | Delegation an entfernte Agent-Dienste | Ersetzt weder Rechte noch Prüfung |
| **Hub-API** | Verbindliche Operationen für alle Adapter | Kein zweites Agent-Protokoll |
| **AG-UI** (optional) | Live-Darstellung im Frontend | Keine fachliche Wahrheit |

### 13.3 Clients des Hub-MCP

| Client | Nutzen |
|---|---|
| Claude Code, Codex, Goose, opencode | Situation 2 und 3: Aufträge holen, Ergebnisse einreichen |
| **Claude-App** (Remote-MCP-Connector) | Aufträge aus dem Chat anlegen und abfragen; das Abo bleibt in Anthropics App |
| **ChatGPT** (Connector/Apps) | Dasselbe für ChatGPT |
| Skill `using-agent-hub` | Bringt jedem Agent die Arbeitsweise des Hubs bei |

Remote-MCP braucht OAuth (CIMD statt Dynamic Client Registration, MCP-Spec 2026-07-28).

### 13.4 Connector

- [ ] Kopplung (siehe 11.2), ein Token pro Gerät
- [ ] Bietet erlaubte Repos und Fähigkeiten an; atomare Übernahme mit Fencing
- [ ] Ein **isolierter Git-Worktree** pro Auftrag
- [ ] Setzt Sitzungen nur fort, wo die Runtime das kann (ACP `session/load`); sonst neue Sitzung mit Übergabepaket
- [ ] Leitet Rückfragen und Freigaben weiter; führt lokale Checks aus (Tests, Lint)
- [ ] Puffert Events lokal und liefert sie per Cursor nach; Reconciliation offener Effekte
- [ ] Erzwingt die Datenklasse lokal (z. B. `local-only` → nur lokale Modelle)
- [ ] Credentials bleiben lokal; der Hub sieht keine Abo-Tokens

| Adapter | Runtime | Phase |
|---|---|---|
| `claude-code` | Unverändertes Claude Code (ACP-Adapter bzw. Agent SDK), lokaler Login | MVP |
| `acp` | Jeder ACP-kompatible Agent (ACP-Registry) | 2 |
| `goose` | Goose (Referenz-Runtime, Multi-Provider) | 2 |
| `codex` | Codex `app-server` | 2 |
| `shell` | Eigene Skripte | 2 |
| `human` | Mensch übernimmt den Schritt in der UI | 1 |

### 13.5 MCP-Werkzeuge

| Werkzeug | Bedeutung |
|---|---|
| `projects.get_context` | Freigegebenen Projektkontext lesen |
| `tasks.list` · `tasks.claim` | Passende Aufträge finden und übernehmen (Fencing-Token) |
| `tasks.report_progress` | Fortschritt mit Belegen |
| `tasks.request_input` · `tasks.request_approval` | Rückfrage bzw. aktionsgebundene Freigabe |
| `effects.request` | Effekt beantragen, den der Hub ausführt (Push, PR, Veröffentlichung) |
| `artifacts.submit` · `artifacts.comment` | Ergebnis einreichen, verankert kommentieren |
| `knowledge.search` · `knowledge.propose` | Verifiziertes Wissen suchen, Wissen vorschlagen |
| `tasks.create` · `tasks.delegate` | Auftrag vorschlagen (L1) bzw. delegieren (L3) |
| `tasks.start` · `tasks.status` · `tasks.result` | Lange Operationen, auch ohne MCP-Tasks-Erweiterung |

## 14. Kosten & Budgets

| Art | Quelle |
|---|---|
| **Gemessen** | Vom Provider gemeldet |
| **Reserviert** | Vor dem Run gebunden |
| **Geschätzt** | Planung und Anzeige |
| **Unbekannt / Kontingent** | Abo-Runtimes und externe Agents ohne Meldung |

- [ ] Budgets pro Workspace, Projekt und Auftrag; Warnungen bei 50/80/100 %
- [ ] Harter Stopp nur, wo Hub oder Connector die kostenpflichtigen Aktionen kontrollieren
- [ ] Kosten pro *akzeptiertem* Auftrag als zentrale Kennzahl

## 15. Hub-Assistenz

Ein eingebauter Assistent, der **nur vorschlägt**. Er läuft auf einem frei wählbaren Modell, auch lokal.

- [ ] **Auftrag formulieren:** Aus Freitext entstehen Ziel, Abnahmekriterien, Playbook und Datenklasse
- [ ] **Bearbeiter vorschlagen** anhand von Scorecards und Verfügbarkeit
- [ ] **Kosten und Dauer schätzen**
- [ ] **Timeline zusammenfassen**, Befunde gruppieren
- [ ] **Tagesdigest:** Was ist passiert, was wartet, was ist gestört
- [ ] **Triage** eingehender Aufträge (Intake)

## 16. Intake & Benachrichtigungen

**Intake** (woher Aufträge kommen):
- Phase 1: UI
- Phase 2: MCP-Clients (Claude-App, Agents ab L1)
- Phase 4: GitHub-Issues (Label), Zeitplan (wiederkehrend), Webhook
- später: E-Mail

**Benachrichtigungen:**
- [ ] Web Push (PWA) und E-Mail-Digest; später Telegram oder Slack
- [ ] Sofort nur bei Blockierendem (Freigabe, Rückfrage, Störung); alles andere im Digest
- [ ] Erinnerung und Eskalation nach Frist; Ruhezeiten

## 17. Observability & Scorecards

- [ ] Audit-Log und Run-Events (append-only); Traces über Langfuse
- [ ] Kill-Switch pro Run, Agent, Gerät und global
- [ ] **Scorecards** pro Agent-Definition × Runtime × Modell × Auftragstyp:
  - Abnahmequote im 1. Versuch
  - Nacharbeitsrunden
  - Kosten pro akzeptiertem Auftrag
  - Durchlaufzeit
  - Störungsrate
- [ ] Der **Wettbewerbsmodus** liefert direkte Vergleiche an der eigenen Arbeit.

## 18. Ausbaustufen

| Bereich | Inhalt |
|---|---|
| **Skill Registry** | Anthropic-Skill-Format, Progressive Disclosure (Index → `SKILL.md` → Ressourcen), Skills pro Playbook-Schritt, Versionierung und Hash, Vorschläge nur mit Review, Skripte nur in der Sandbox |
| **Modelle & Provider** | OpenRouter (OAuth PKCE), BYOK, OpenAI-kompatibel, lokal über den Connector; Fähigkeitsprofile; Claude-Abo ⚠️ nur über Claude Code bzw. Claude-App; ChatGPT über „Sign in with ChatGPT“ (Self-Serve bei privater Open-Source-Instanz) oder Codex |
| **Chat** | Als Auftrags-Oberfläche: Auftrag aus dem Gespräch, Rückfragen und Freigaben im Chat |
| **Hub-Runtime** | Harness in der Cloud-Sandbox (Vercel Sandbox / Daytona, AI SDK `HarnessAgent`) auf demselben Run-Modell |
| **A2A & Gateway** | A2A-Client und -Server, Interop-Tests mit `a2a-samples`, später agentgateway |
| **Mobile** | PWA mit Inbox, Freigaben und Ampel (Vorbild: Happy) |

---

# D. Umsetzung

## 19. Bauen oder erweitern?

| Repository | Relevanz | Prüffrage (Phase 0a) |
|---|---|---|
| **paperclipai/paperclip** (MIT) | Adapter, atomare Übernahme, Budgets, Governance | Lassen sich Arbeitsraum, Playbooks und Fencing als Erweiterung abbilden? Ist die Org-Metapher zu schwer? |
| **slopus/happy** (MIT) | Relay, Fernsteuerung von Sitzungen, Mobile | Sind Relay und Gerätekopplung nutzbar? |
| **aaif-goose/goose** (Apache-2.0) | Lokale Runtime mit Multi-Provider und MCP | Referenz-Runtime statt Eigenbau? |
| **agentclientprotocol/** (Protokoll + Registry) | Standard für Coding-Agent-Sitzungen | Basis des Connector-Adapters |
| modelcontextprotocol/typescript-sdk | Offizielles MCP-SDK | Basis des MCP-Zugangs |
| a2aproject/a2a-samples | Offizielle Beispiele | Basis des A2A-Adapters |
| BloopAI/vibe-kanban | Worktrees, Review-UI | Nur UI-Ideen; ⚠️ wird eingestellt |
| agentgateway/agentgateway | Gateway für MCP, A2A und LLM | Später |

| Schicht | Erste Wahl | Alternativen |
|---|---|---|
| Durable Workflows | `vercel/workflow` | trigger.dev, Restate; Vorbild temporal-agent-harness |
| Sandbox | Vercel Sandbox | Daytona, E2B |
| Tracing/Evals | Langfuse | Vercel Observability |
| Live-UI | Eigenes SSE-Event-Schema | AG-UI |

## 20. Technischer Rahmen (vorläufig)

| Schicht | Wahl |
|---|---|
| Web + Hub-API | Next.js 16 + TypeScript auf Vercel; PWA |
| DB | Postgres (Neon) + Drizzle; Transactional Outbox; `SKIP LOCKED` + `claim_epoch` |
| Ablaufsteuerung | Playbook-Engine auf Vercel Workflow (hinter einem Interface) |
| Artefakte | S3-kompatibel (Vercel Blob), Content-Hash |
| Realtime | SSE mit Event-Cursor; WSS-Relay für Connectors (Vercel WS-Beta oder Cloudflare DO) |
| Auth | Better Auth (Menschen), Kopplungscode (Geräte und Agents), OAuth/CIMD (Remote-MCP-Clients) |
| Connector | Node-CLI `agent-hub-connector` mit ACP-Client, SDK- oder CLI-Fallback |
| MCP | `@modelcontextprotocol/sdk`, stateless HTTP |
| Effekte | GitHub App (PR, Merge) im Hub; lokale Git-Operationen im Connector |

## 21. Kern-Datenmodell (Skizze)

```
-- Organisation & Identität
users, workspaces, memberships(role)
projects (workspace_id, repos jsonb, data_class, budget, default_playbooks[])
devices (workspace_id, owner_id, name, token_hash, conn_state, last_seen, event_cursor)
runtimes (device_id | null, adapter, capabilities jsonb, capacity)
agent_definitions (workspace_id, name, role, instructions_ref, skills[], grant_template, owner_id)
agent_bindings (agent_definition_id, runtime_id, model, token_hash, status)
autonomy (agent_definition_id, project_id, level)
grants (subject_type, subject_id, parent_grant_id, actions[], paths[], repos[],
        network jsonb, budget_reserved, expires_at)

-- Arbeit
playbooks (name, version, spec jsonb)
jobs (project_id, owner_id, parent_job_id, version, goal, acceptance_criteria jsonb,
      input_versions jsonb, base_state jsonb, playbook_ref, data_class, grant_id,
      status, limits jsonb, chain_depth, deadline)
job_steps (job_id, step_id, assignee_type: user|agent, assignee_id, status,
           claim_epoch, lease_until, rework_count)
runs (job_step_id, binding_id | user_id, runtime_id, model, attempt, claim_epoch,
      run_state, session_ref, handover_package_ref, job_version)
run_events (run_id, seq, type, payload jsonb)                       -- append-only
effects (run_id, idempotency_key UNIQUE, kind, params_hash, executor: hub|connector,
         status, result jsonb)
approvals (run_id, action, params_hash, decision, decided_by, valid_until)
artifacts (job_id, run_id, version, kind, blob_ref, content_hash, claim_epoch)
evidence (artifact_id | run_event_id, kind, ref, excerpt)
checks (artifact_id, check_type, status, output_ref)
reviews (artifact_id, reviewer_type, reviewer_id, findings jsonb, verdict)
comments (artifact_id, anchor jsonb, author_type, author_id, body, resolved)
acceptances (job_id, artifact_id, decision, decided_by, feedback jsonb)
leases (resource_type, resource_ref, job_id, claim_epoch, until)
costs (run_id, kind: measured|reserved|estimated|unknown, amount, source)

-- Kontext
knowledge_items (project_id, version, status: proposed|verified|retired, content,
                 source_artifact_id, verified_by)
job_context_snapshots (run_id, snapshot jsonb)
notes (scope, author, provisional = true)

-- Infrastruktur
outbox (aggregate, event, payload, created_at, dispatched_at)
notifications (user_id, kind, ref, urgency, delivered_at, read_at)
audit_log
```

## 22. Domain Events (Grundlage für die Spec)

```
Projekt:     ProjectCreated · PolicyChanged · KnowledgeProposed · KnowledgeVerified
Auftrag:     JobCreated · JobAmended · JobOpened · JobCancelled · JobCompleted · JobFailed
Schritt:     StepAssigned · StepClaimed · StepLeaseRenewed · StepLeaseExpired · StepReassigned
Run:         RunStarted · RunProgressReported · RunPaused · RunResumed
             RunCancelRequested · RunCancelConfirmed · RunExited · RunLost
Interaktion: InputRequested · InputProvided · ApprovalRequested · ApprovalGranted · ApprovalDenied
Effekt:      EffectRequested · EffectIntended · EffectExecuted · EffectFailed · OutcomeUnknownRaised · EffectReconciled
Ergebnis:    ArtifactSubmitted · CheckPassed · CheckFailed · ReviewCompleted
             ArtifactAccepted · ArtifactRejected · ReworkStarted · ApplyStarted · ApplyCompleted
Identität:   PairingRequested · PairingConfirmed · GrantIssued · GrantAttenuated · GrantRevoked · AutonomyChanged
Verbindung:  DeviceOnline · DeviceDegraded · DeviceOffline · DeviceRevoked
Kosten:      BudgetReserved · CostMeasured · BudgetThresholdReached · BudgetExhausted
```

## 23. Erfolgsmessung

| Metrik | Ziel (MVP) |
|---|---|
| **Nordstern:** akzeptierte Aufträge pro Woche, die ohne manuelle Nacharbeit übernommen wurden | Steigend |
| Abnahmequote im 1. Versuch | > 50 % |
| Entscheidungslatenz (Median bis zur Freigabe) | < 15 min tagsüber |
| Wiederherstellung nach Störungen ohne Verlust oder Doppelwirkung | **100 %** |
| Status ohne Log-Lektüre verstanden (Selbsttest: 5 Sekunden pro Auftrag) | Ja |
| Kosten pro akzeptiertem Auftrag | Sichtbar und vergleichbar |

## 24. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Scope zu groß für eine Person | Nicht-Ziele, Phase 0a (erweitern statt bauen), enger MVP |
| Runtime-Schnittstellen ändern sich (Claude Code, ACP, Codex) | Adapter-Schicht, Contract-Tests pro Adapter |
| Provider-Terms ändern sich | Abos nur über offizielle Clients; der Hub sieht keine Tokens |
| Zuverlässigkeit komplexer als gedacht | Chaos-Tests ab Phase 1, Outbox, Fencing, offene Anzeige von „Ausgang unklar“ |
| Vercel-Limits (Function-Dauer, WS-Beta) | Ausführung nie in Functions; Connector bzw. Sandbox; Relay austauschbar |
| Prompt-Injection über Artefakte, Kommentare, Wissen | `untrusted`-Markierung, Wissen erst nach Prüfung, Effekte über den Hub |
| Freigabe-Müdigkeit | Bündelung, Freigabe-Regeln pro Projekt, Autonomie-Stufen |
| Datenabfluss an Cloud-Provider | Datenklassen, Durchsetzung durch Hub und Connector |

## 25. Roadmap

| Phase | Ziel | Inhalt | Exit-Kriterium |
|---|---|---|---|
| **0a – Machbarkeit** | Bauen oder erweitern? | Je ~1 Tag: Paperclip, Happy, Goose + ACP gegen den Nordstern-Ablauf | Entscheidungsdokument |
| **0b – Spec** | Vertrag | Zustandsautomaten, Fehlerfälle, Domain Events, Playbook-Schema, Hub-API, MCP-Tools, Connector-Protokoll, Threat Model | Spec reviewt |
| **1 – Kern** | Nordstern-Ablauf | Workspace, Projekt, Kopplung, Playbook `code-change`, Connector + `claude-code` + `human`, Checks, Review-Agent, Freigaben, Effekte (PR), Inbox + Ampel + Auftragsansicht, MCP | MVP-Abnahme inkl. Chaos-Tests grün |
| **2 – Breite** | Mehr Arbeit, mehr Runtimes | Adapter `acp`, `goose`, `codex`, `shell`; Playbooks `research-report`, `text-edit`; Wissensebenen; Skills v1; Claude-App per Remote-MCP | 3 Runtimes, 3 Auftragstypen |
| **3 – Autonomie** | Agents organisieren sich | Stufen L1–L3, `tasks.delegate`, Attenuation, Kettenlimits, Wettbewerbsmodus, Scorecards | Kette Coder → Tester → Reviewer bis zur Abnahme |
| **4 – Komfort** | Weniger Bedienlast | Hub-Assistenz, Datenklassen-UI, Provider-Register, Chat, PWA + Push, Intake (GitHub, Zeitplan) | Auftrag aus Issue, Freigabe vom Telefon |
| **5 – Cloud & Netz** | Ohne lokalen Rechner | Hub-Runtime in der Sandbox, A2A, agentgateway, L4 | Externer A2A-Agent liefert ab |

### MVP-Abnahme (Phase 1)

- [ ] Ein lokaler Agent erledigt einen im Hub angelegten Auftrag; ein zweiter Agent reviewt; Übernahme als PR
- [ ] **Connector beenden** mitten im Run: kein Verlust
- [ ] **Netzwerk unterbrechen**: Fortsetzung per Cursor
- [ ] **Doppelt zustellen**: keine doppelte Übernahme
- [ ] **Rechte entziehen**: neue Aktionen abgewiesen, ausgelöste abgeglichen
- [ ] **Veraltetes Ergebnis einreichen**: per Fencing abgewiesen
- [ ] **Effekt ohne Bestätigung**: `outcome_unknown` und anschließender Abgleich
- [ ] Eine Freigabe wird im Hub erteilt, der Lauf geht weiter
- [ ] Der Status ist ohne Log-Lektüre erkennbar
- [ ] Rückverfolgbar ist, welcher Bearbeiter mit welcher Befugnis, Runtime und welchem Modell welches Ergebnis erzeugt hat

## 26. Offene Entscheidungen

- [x] Betrieb: private Instanz (self-hosted, Open Source)
- [x] Erste Runtime: Claude Code
- [ ] **Bauen vs. Paperclip erweitern** (Phase 0a)
- [ ] Ablaufsteuerung: Vercel Workflow vs. trigger.dev vs. Restate
- [ ] Playbook-Format: YAML (deklarativ) vs. TypeScript (flexibel)
- [ ] Projektwissen: in der DB oder als Markdown in Git (für Agents direkt lesbar, versioniert)
- [ ] Connector-Transport: Long-Poll + SSE oder WSS
- [ ] Claude-Code-Anbindung: ACP-Adapter oder Agent SDK direkt
- [ ] Wer führt `git push` aus: Connector (lokal) oder Hub (GitHub App)?
- [ ] Benachrichtigungskanäle neben Web Push und E-Mail
- [ ] AG-UI oder eigenes Event-Schema
