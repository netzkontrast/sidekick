# Plan-Review 31.10.2026: Stand, Kritik, nächste Pakete

> Anlass: Owner-Auftrag nach dem Merge von #31–#36 („überarbeite, erweitere und kritisiere den Plan – was ist als Nächstes zu tun?“).
> Stand: `main` nach Merge von #33 (`3ae6349`), 224 Node-Tests grün, Validator und Rubrik-Check Exit 0.
> Status bleibt in den vorhandenen Ablagen: Hub im [PLAN](PLAN.md), Skill-Library im [Library-Research-Plan](../../skills-meta-prompting/library-research-plan.md).
> Dieses Dokument begründet die Reihenfolge; es ist kein drittes Backlog.

## 1. Was heute gemergt ist

| PR | Ergebnis |
|---|---|
| #31 | Dossiers [afs-spec](../../../docs/research/dossiers/afs-spec.md) und [DSPy-Begleitrepo](../../../docs/research/dossiers/context-engineering-dspy-book.md) (Stand `a633241`), Herkunftsregister |
| #32 | [Runtime-Adapter-Spec](../../../docs/spec/runtime-adapter-v0.md) (Entwurf, 58 Anforderungen, 48 Fälle, Schema, Claude-Code-Profil) |
| #34 | Eval-Harness: USD-Deckel im Ledger, gepaarter McNemar-Test, Bootstrap über Familien (SLV0-EVAL-43…46; -47/-48 nur spezifiziert) |
| #35 | Skill [`using-codegraph`](../../../.agents/skills/using-codegraph/SKILL.md), Regel in `CLAUDE.md`/`AGENTS.md`, Rubrik-Entwurf; neun Skill-Pakete |
| #36 | Dossier [MUXI Runtime](../../../docs/research/dossiers/muxi-runtime.md), Run-Supervisor-Plan RS-1…RS-4 im PLAN |
| #33 | [DSPy-Integrationsplan](../../skills-meta-prompting/dspy-book-integration-plan.md) D0–D7 (Buchstand `92d97ca`) |

## 2. Kritik

Belegt mit Fundstellen im Repo; Wertungen sind als solche formuliert.

**K1 – Der Kern rückt nicht vor, die Ränder wachsen.** Alle vier Entscheidungstore stehen auf `offen` (`docs/entscheidungen/tor-*.md`, Zeile 3).
Die P0-Punkte des [PLAN](PLAN.md) (Paperclip, OpenHands, Claude ACP gegen SDK, Happy) sind seit der Erstaufnahme unbearbeitet.
Dagegen ist die Skill-Library weit gediehen: SL0–SL7 abgenommen, P0–P12, fünf E3-Runden, heute AP3 und D0–D7.
`AGENTS.md` verlangt das Gegenteil: „Recherche-Zeit auf P0-Fragen konzentrieren; keine Feature-Listen für P1/P2 vor dem MVP.“
Auch die heutige Arbeit (Adapter-Spec, Eval-Statistik, DSPy-Plan) hat kein Tor geschlossen.

**K2 – Spec-Schulden statt ausführbarer Verträge.** V0, Skill-Library V0 und Runtime-Adapter V0 stehen auf „Entwurf“.
Die 48 RTA-Fälle und die V0-Fallmatrix V0-FALL-01…17 sind nicht ausführbar, weil es keine Fake-Runtime und keinen Kernprototyp gibt.
Jede weitere Spec erhöht die Review-Last, ohne dass ein Fall je rot oder grün war.

**K3 – Veraltete Daten im eigenen Dossier.** Das DSPy-Dossier aus #31 nennt Stand `a633241` (771 Dateien, COPRO 50 %, Kapitel 11 mit 3-Aufrufe-Smoke).
Am aktuellen Stand `92d97ca` gelten 346 Dateien, 58 Notebooks und COPRO 45/80 (+2,5 pp) (nachgeprüft in `chapter06/CHAPTER_RESULTS.md`); #33 nennt für Kapitel 11 80 Metrikaufrufe.
Die Präsentation vom 31.10. zeigt noch die alten Werte.

**K4 – Der DSPy-Pilot ist teuer gemessen an der bisherigen Trefferquote.** D3 sieht bis zu 164 Harness-Starts und 65 USD für einen Skill vor.
Die bisherigen Lernrunden zeigen eine niedrige Erfolgsquote: E3-2 beide Kandidaten verworfen, P7 verworfen, P8 zurückgestellt, P6 nicht vorgelegt; nur K-AUFTEILUNG wurde aktiv
([Library-Plan §8.1](../../skills-meta-prompting/library-research-plan.md#81-phase-2-portierung-p0p12-und-laufende-messrunden)).
Mehrfach hieß es „B1 erfüllt den Kern bereits“. Ohne Vorprüfung, ob grilling überhaupt messbaren Spielraum hat, ist ein Optimizer-Lauf vor allem Kostenrisiko.
Dazu kämen zwei neue Python-Dependencies (dspy, gepa), die nach `AGENTS.md` der Owner freigeben muss.

**K5 – Kostendeckel nur je Start.** Das Ledger aus #34 reserviert pro Start. D1 in #33 verlangt eine Reservierung pro Modellaufruf (Worker, Reflexion, Judge, Retry).
EVAL-47 (Offenlegung der Testauswahl) und EVAL-48 (Positionswechsel) sind nicht gebaut. Der Deckel ist zudem ein Protokoll: Er hält nur, wenn jeder Start über das Ledger läuft.

**K6 – Clean-Room-Risiko durch den gemeinsamen CodeGraph-Index.** Der Index liegt auf `/home/user` und umfasst neben sidekick auch MUXI (Elastic License 2.0), afs-spec und den DSPy-Code.
Beim Arbeiten an sidekick schlägt der Hook fremde Symbole vor (beobachtet am 31.10., z. B. `_merge_groups` aus MUXI bei einer Frage zu sidekick).
Ein implementierender Agent kann so unbemerkt Fremdcode lesen. Das widerspricht der Clean-Room-Regel in `AGENTS.md`.

**K7 – Drei parallele Paketsysteme.** AP1–AP5, RS-1…RS-4 (PLAN), D0–D7 und P0–P12 (Library-Plan), V0–V6/N0 (Bauauftrag).
Die Abhängigkeiten zwischen ihnen stehen nirgends gesammelt. Zum Beispiel braucht D1 AP3/AP4, und D3 braucht den Run-Supervisor aus RS-2/RS-3 als Runner.

**K8 – Eine Annahme ist überholt: Die Claude-CLI fehlt nicht mehr.** Der Library-Plan vermerkt bei P9 „hier keine Claude-CLI verfügbar“.
In der aktuellen Umgebung ist Claude Code 2.1.316 installiert, ebenso Docker. Tor B (CLI-Pfad) und QO-1 sind damit praktisch prüfbar.
Ob die CLI hier authentifiziert ist, ist ungeprüft.

**K9 – Die Paketzahl hat sich geändert.** Mit `using-codegraph` gibt es neun Pakete. B1 (`skill-pilot-baseline-v2.json`) hat acht.
Jede neue E-Runde muss gegen einen neu eingefrorenen Stand laufen oder den neuen Skill als Dimension ausweisen.

**K10 – Flüchtige Umgebung.** Die Klone der Fremd-Repos und die globale `~/.claude/CLAUDE.md` liegen im Container und gehen verloren. Dauerhaft ist nur, was im Repo steht.

## 3. Leitentscheidung für die nächsten Schritte (Vorschlag)

**Kern vor Library.** Die nächsten Pakete schließen zuerst Tor B und Tor A und machen die vorhandenen Verträge ausführbar.
Die Skill-Library-Arbeit läuft nur weiter, wo sie nichts kostet oder dem Kern direkt dient. D2–D7 warten.

## 4. Nächste Pakete

Reihenfolge nach Abhängigkeiten. N1, N3 und N7 sind parallel möglich; N2 und N4 brauchen eine Owner-Freigabe.

### N1 – Aktualität herstellen (klein, sofort)

- **Ziel:** Kein Dokument im Repo widerspricht dem gelesenen Quellstand.
- **Eingaben:** DSPy-Repo `92d97ca`; #33 §3; MUXI-Dossier (Befunde 3–6); Runtime-Adapter-Spec.
- **Artefakte:** DSPy-Dossier auf `92d97ca` (Kopf, Zahlen, Kapitel 11, Dateizuordnung neu gezählt); RS-1: drei Ergänzungen in `runtime-adapter-v0.md` (Umgebung per Positivliste, Negativfall „Rückweg ohne Freigabe“, benannter Kapazitätsbezug) mit neuen IDs und Fällen; die Präsentation korrigiert.
- **Abnahme:** COPRO, Datei- und Notebookzahlen aus dem Quellrepo nachgezählt; Rückverfolgungsskript der RTA-Spec ohne Lücke; Schema und Beispiel validieren.
- **Nachweis:** Befehlsausgaben im PR.

### N2 – Tor B praktisch: Claude-CLI-Pfad (P0, kritischer Pfad; Owner-Budget nötig)

- **Ziel:** Die Zellen der Tor-B-Matrix für die strukturierte CLI sind *praktisch nachgewiesen* oder begründet *offen*.
- **Eingaben:** [Tor B](../../../docs/entscheidungen/tor-b-claude-anbindung.md); Beispielprofil `docs/spec/beispiele/runtime-adapter-claude-code.json`; Ledger mit Deckel aus #34.
- **Prüfungen:** Anlegen und Fortsetzen der Session (`--session-id`, `--resume`); Abbruch der Prozessgruppe mitten im Lauf; Timeout; `total_cost_usd` und Usage im Stream; Rechtemodi `plan` und `acceptEdits` gegen einen Kanarienpfad; Verhalten nach Neustart des aufrufenden Prozesses.
- **Rahmen (Vorschlag):** höchstens 12 Starts, Deckel 3 USD mit 0,50 USD Reserve, synthetisches Arbeitsverzeichnis, Datenklasse `public`.
- **Artefakte:** Experimentprotokoll unter `research/agent-hub/experiments/`; Tor-B-Matrix ausgefüllt; Fähigkeiten im Profil mit Beleg.
- **Abnahme:** Jede Matrixzeile der Spalte „Strukturierte CLI“ hat einen Belegstatus; kein Abo-Token verlässt die CLI.
- **Blockade:** Auth der CLI in der Umgebung ungeprüft; ACP und Agent SDK bleiben ein eigener Teil von Tor B.

### N3 – Fake-Runtime und ausführbare Adapter-Verträge (RS-2, ohne Kosten)

- **Ziel:** Die RTA-Fälle laufen als Tests gegen eine deterministische Fake-Runtime.
- **Eingaben:** Runtime-Adapter-Spec nach N1.
- **Artefakte:** Fake-Runtime (Skript mit steuerbarem Verhalten: Ausgabe, Session-ID, Exit, Hängen, Kindprozess) und ein minimaler Supervisor-Prototyp mit Tests. Ablageort zu entscheiden (siehe Owner-Fragen); Node ohne Dependencies, passend zu O-4.
- **Abnahme:** Mindestens die Fälle zu Profilprüfung, Aufruf, Timeout, Abbruch und Ausgabe (RTA-FALL-01…31) sind grün; die übrigen sind als offen markiert.
- **Zustand und Rechte:** nur lokales Testverzeichnis, keine Credentials, kein Netz.

### N4 – Tor A in die Praxis holen (P0; Owner-Freigabe für Laufzeit nötig)

- **Ziel:** Für Paperclip und OpenHands ist belegt, ob sie den [Nordstern-Ablauf](../experiments/north-star.md) ohne Kernumbau tragen.
- **Eingaben:** Dossiers [Paperclip](../repos/paperclip.md), [OpenHands](../repos/openhands.md); Docker ist in der Umgebung vorhanden.
- **Erster Schritt (Spike, 1 Tag):** Beide lokal starten; prüfen, ob Claims und Freigaben je Aktion möglich sind und was ein Neustart mit laufenden Aufträgen macht. Erst danach entscheiden, ob der volle Tor-A-Test lohnt.
- **Abnahme:** Dossiers mit *praktisch nachgewiesen*/*offen* je Kriterium aus Analyse §6; harte Ausschlüsse benannt.
- **Nutzen der heutigen Arbeit:** Die RTA-Anti-Muster und die MUXI-Befunde dienen als Prüfliste (Freigabe-Bypass, ungeprüfte Flags, Umgebung, Neustart).

### N5 – Vorprüfung vor jedem Optimizer-Lauf (D0/D1 in kleinerem Schnitt, ohne Kosten)

- **Ziel:** Vor D3 ist belegt, ob grilling auf eigenen Familien messbaren Spielraum hat.
- **Artefakte:** D0 wie in #33, aber das Dossier-Update erledigt N1; eigene grilling-Familien (dev/select/test) mit Nulllauf; Auswertung, wie viele Fälle B1 nicht besteht.
- **Abnahme:** Liegt der Anteil trennender, von B1 nicht bestandener Fälle unter einer vorher festgelegten Schwelle (Vorschlag: weniger als 3 von 8 select-Familien), wird D3 nicht gestartet und als Nullergebnis dokumentiert.
- **Ergänzung des Harness:** Reservierung je Modellaufruf (K5) als Spec-Erweiterung SLV0-EVAL-49 ff. vor jedem Lauf mit Reflexion oder Judge.

### N6 – AP4 nur als Fallfamilie (ohne Läufe)

AGENTS.md-Anti-Muster als eigene Familien schreiben, mit Holdout. Keine Läufe, bis N5 zeigt, ob sich Optimierung lohnt. Kein zweites Optimierungsziel neben grilling.

### N7 – CodeGraph-Index trennen (Owner-Entscheidung)

Eigener Index nur für sidekick (`codegraph init` im Repo, durch den Owner) oder Ausschluss der Fremdklone über `codegraph.json`. Fremdrepos bei Bedarf mit eigenem Index und `projectPath` abfragen.

## 5. Zurückgestellt

| Paket | Grund | Wieder aufnehmen, wenn |
|---|---|---|
| D2–D7 (Python-Werkstatt, Export, Auswahl, Pipeline) | K4; Dependencies offen | N5 zeigt Spielraum und der Owner gibt Dependencies und Budget frei |
| AP5 (Kontext- und Grant-Bausteine) | gehört in die V1-Spec | Tor A entschieden |
| RS-4 (Supervisor-Code) | Phase 1 | Tor B entschieden, N3 grün |
| SLV0-EVAL-47/-48 | kein Bericht je Split, keine Paarurteile im Harness | ein E-Lauf braucht sie |

## 6. Entscheidungen, die der Owner treffen muss

1. **Leitentscheidung:** Kern vor Library für die nächsten Pakete. Ja oder nein?
2. **N2-Budget:** bis 12 CLI-Starts und 3 USD für Tor B, mit Ledger-Deckel. Und: Ist die CLI hier mit einem zulässigen Zugang angemeldet?
3. **N4:** Darf Docker hier Paperclip und OpenHands starten (Netz, Images, Zeitbox 1 Tag)?
4. **N3-Ablage:** Prototyp unter `tools/` (wie die Skill-Library) oder unter `research/`, bis Phase 1 die Sprache festlegt (O-4)?
5. **N7:** Eigener CodeGraph-Index für sidekick.

## 7. Nächster ausführbarer Schritt

N1 ist erledigt (31.10.2026). Die Pakete N2–N7 sind in den [Gesamtplan](gesamtplan-2026-11.md) übergegangen (Zuordnung dort §6); nächster Schritt ist M1.1.
