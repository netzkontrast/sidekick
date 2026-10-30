# SL0 – Bestandsaufnahme der Skill-Library

> Stand 30.10.2026 · Ergebnis von SL0 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Gelesene Stände: main `38333a40`, dieser Branch ab `549ad85`, [PR #8](https://github.com/netzkontrast/sidekick/pull/8) `02a175c7` (V0-Spec, offen),
> [PR #11](https://github.com/netzkontrast/sidekick/pull/11) `de8e6ae1` (Owner-Grundsatzentscheidungen, offen).
> Evidenz wie in `AGENTS.md`: *dokumentiert*, *im Code gefunden*, *praktisch nachgewiesen*, *offen*. Hier gibt es keinen Code; „lokal geprüft“ heißt
> eine Prüfung mit eigenem Skript an den Dateien dieses Branches.

## 1. Kurzfassung

- Es gibt vier Skills. Formal sind sie sauber (lokal geprüft, §2.2). Ob ein Client sie findet, auswählt und ob sie das Ergebnis verbessern, ist **nicht gemessen**.
  Beide Evaluationsdateien stehen auf `not_run`.
- Von den neun Bereichen sind vier durch bestehende Skills abgedeckt (A01–A04). Fünf haben keinen Skill (A05–A09). Für alle fünf gibt es aber
  Anforderungen in K1–K8, in der V0-Spec oder in der Vision. Kein Bereich startet bei null.
- Es gibt heute **keine** Library-Mechanik: keine Version oder Hash je Skill, keine Auswahl außerhalb des Clients, keine Komposition und keine Messung.
  Das ist erwartbar und genau der Gegenstand von SL1–SL7.
- Zwei Fixture-Widersprüche (B06, B10) und eine Projektbindung im portablen Grilling-Skill sind konkrete Korrekturkandidaten. Die Korrekturvorschläge
  stehen in [SL1](library-evaluation-design.md#6-korrekturvorschläge-b06-und-b10); geändert wird erst nach Review.

## 2. Die vier vorhandenen Skills

### 2.1 Zweck, Auslöser, Größe

Größen sind Bytes und Wörter, **keine Tokens** (K7.1). Gemessen mit `wc` an diesem Branch.

| Skill | Zweck (eigene Kurzfassung) | Nicht-Trigger laut Beschreibung | SKILL.md | Referenzen | Evaluationsfälle |
|---|---|---|---|---|---|
| `grilling` | Entscheidungsrelevante Fragen per AskUser klären und persistent ablegen | Reine Faktenrecherche, triviale Änderungen, schon beantwortete Entscheidungen | 3409 B / 387 W | `workflow.md` 4529 B, `records.md` 2010 B | [grilling-evaluation.json](../../docs/research/grilling-evaluation.json): 6 Trigger, 11 Verhalten |
| `researching-repositories` | Repos und technische Fähigkeiten mit Evidenzstufen untersuchen | Reine Codeänderungen, allgemeine Faktenfragen | 1791 B / 201 W | `report.md` 436 B | [skill-evaluation.json](../../docs/research/skill-evaluation.json): 2 Fälle |
| `planning-work-packages` | Ziele in prüfbare Pakete zerlegen | Triviale Einzelschritte, schon geplante Ausführung | 1872 B / 214 W | `package.md` 457 B | dto.: 2 Fälle |
| `reviewing-decision-gates` | Entscheidungsreife anhand von Belegen prüfen | Brainstorming, reines Code-Review | 1753 B / 198 W | `review.md` 462 B | dto.: 2 Fälle |

Gemeinsame Negativfälle in `skill-evaluation.json`: drei (Tippfehler, Wissensfrage, schon vollständiger Plan). Grilling hat zwei eigene Negativfälle.

### 2.2 Format und Ablage

**Lokal geprüft** (Python-Skript gegen die Regeln aus der [Agent-Skills-Spezifikation](https://agentskills.io/specification), abgerufen 30.10.2026):
`name` passt zum Ordner und zum erlaubten Muster, `description` ist 264–342 Zeichen lang (Limit 1024), keine weiteren Frontmatter-Felder,
Rumpf 11–13 Zeilen (Empfehlung < 500), alle Referenzlinks existieren, alle vier Symlinks unter `.claude/skills/` zeigen auf `.agents/skills/`.
Das offizielle `skills-ref validate` wurde **nicht** ausgeführt; es wäre eine neue Dependency.

**Dokumentiert** ([Claude-Code-Skills](https://code.claude.com/docs/en/skills), abgerufen 30.10.2026): Claude Code lädt Projekt-Skills aus `.claude/skills/`.
Ein Eintrag darf ein Symlink sein. Beschreibungen stehen dauerhaft im Kontext (gekürzt auf 1536 Zeichen), der Rumpf erst beim Aufruf.
`.agents/skills/` wird auf dieser Seite nicht erwähnt. Für Claude Code trägt also nur der Symlink.

**Laut Repo-Doku, nicht neu geprüft:** Codex liest die optionalen Metadaten in `agents/openai.yaml`. Alle vier setzen `allow_implicit_invocation: true`
([wiederverwendbare-skills.md](../../docs/research/wiederverwendbare-skills.md)).

### 2.3 Was fehlt, gemessen an K1

| Anforderung | Stand |
|---|---|
| K1.1 Kanonisches Format, Adapter generiert | Teilweise: eine kanonische Quelle, Claude per Symlink, Codex per Handpflege von `openai.yaml` |
| K1.2 Validator | Fehlt im Repo; nur das Ad-hoc-Skript dieser Prüfung |
| K1.3 Zweiphasiges Laden mit Budget | Vom Client geleistet (dokumentiert), kein eigenes Budget |
| K1.5 Discovery/Trigger/Verhalten getrennt geprüft | Fixtures vorhanden, **nicht ausgeführt** |
| Version und Inhaltshash je Skill | Fehlt; nur der Git-Commit identifiziert den Stand |

### 2.4 Auffälligkeiten

1. **Projektbindung im portablen Skill.** `grilling/SKILL.md` Schritt 2 und `references/workflow.md` nennen `docs/fragen/` und „Sidekick“.
   Die drei anderen Skills sind projektfrei. Laut Plan §2 gehört das in lokale Konfiguration. Vorschlag für SL2/A01: Ablageort aus `AGENTS.md` lesen,
   Skill-Text projektneutral.
2. **B06 ist unvollständig.** Das Ereignis „zwei offene Fragen“ führt zur Assertion „Session paused“. Es fehlt der Auslöser für die Pause.
3. **B10 widerspricht dem Skill.** „Alle Fragen beantwortet“ soll eine neue Runde erzeugen. Der Skill (Schritt 4 und 8) fragt aber nur bei echter neuer Lücke weiter.
4. **Fixtures sind Designs, keine Ergebnisse.** Beide Dateien stehen auf `not_run`. Keine Aussage dieses Dokuments stützt sich auf einen Lauf.
5. **AskUser praktisch beobachtet, aber nur interaktiv.** In dieser Claude-Code-Session wurde `AskUserQuestion` zweimal erfolgreich benutzt
   ([V0-Fragen](https://github.com/netzkontrast/sidekick/pull/8), [Skill-Library-Fragen](../../docs/fragen/skill-library/index.md)).
   Ob das Werkzeug in einem headless `claude -p`-Lauf verfügbar ist, ist **offen**. Davon hängt ab, wie E1 Verhalten misst (SL1 §4).

## 3. Neun Bereiche: Zuordnung

Spalte „Vorläufig“ ist eine Arbeitshypothese für SL2, keine Entscheidung. Kategorien aus Plan §4: *ändern*, *ergänzen*, *deterministisch*, *zurückstellen*.

| ID | Bereich | Vorhandener Skill | K/WEB-Anforderungen | Bezug V0 (PR #8) / Vision | Lücke | Vorläufig |
|---|---|---|---|---|---|---|
| A01 | grilling | `grilling` | K8.5, WEB-R8 | Rückfrage V0-RFG, V0-FALL-14; `docs/fragen/human-input` | Projektbindung; B06/B10; headless-Verfügbarkeit von AskUser offen | *ändern* |
| A02 | researching-repositories | `researching-repositories` | K5.5 (Rohbelege), WEB-R10 | Belege in V0-ABL-01 Schritt 8 | Kein Dossier-Schema; nur 2 Fälle | *ändern* (Fälle ergänzen) |
| A03 | planning-work-packages | `planning-work-packages` | K6.5 (Historie) | Auftrag V0-AUF, Abnahmekriterien im Auftragsschema | Keine Felder für Zustandseigentum und Datenweg | *ändern* |
| A04 | reviewing-decision-gates | `reviewing-decision-gates` | K5.6 (eine Rubrik) | Tore A–D, `docs/entscheidungen/` | Nur 2 Fälle; Konsistenz des Registers ungeprüft | *ändern* (Fälle ergänzen) |
| A05 | specifying-behavior | – | K2.4 (Signaturen), K3.3 | Spec-Konventionen in PR #8 (`docs/spec/`, IDs, Schemas, Fixtures) | Kein Skill; die Konvention existiert erst als Entwurf | *ergänzen*, nach Merge von #8 |
| A06 | resuming-work | – | K4.1/K4.2 (Kontextpaket) | V0-FALL-04/-05, Übergabepaket (v4 §9.4) | Kein Skill; kein Format für Übergaben | *ergänzen* |
| A07 | testing-system-boundaries | – | K8.5, WEB-R8 | Fallmatrix V0-FALL-01…17 | Kein Skill; Fälle existieren nur als Spec-Tabelle | Teilweise *deterministisch* (Contract-Tests), Skill offen |
| A08 | evaluating-changes | – | K5.1–K5.8, K7.5–K7.7, WEB-R1–R7 | Effekt-/Tor-Muster für Skill-Kandidaten | Größte Lücke: keine Harness, keine Läufe | *ergänzen*; Harness *deterministisch* |
| A09 | consolidating-knowledge | – | K8.3 (Speicherschichten), K6.6 | Erinnerung V0-ERI, V0-FALL-15, `erinnerung.schema.json` | Kein Skill; Erinnerungsvertrag nur als Entwurf | *zurückstellen* bis V5-Spec, Fälle aber jetzt in SL1 |

Jede K-Gruppe ist mindestens einem Bereich zugeordnet. Folgende Anforderungen haben keinen Bereich, weil sie Laufzeit oder Library-Mechanik sind,
nicht Skill-Inhalt: K1.1–K1.4 (Paketformat), K2.1–K2.3/K2.5/K2.6 (Technik-Katalog), K3.1/K3.2/K3.4/K3.5 (Registry, Gates), K4.3–K4.5 (Zerlegung), K7.1–K7.4 (Tokens, Preise).
Sie gehören in SL3 (Komposition) und SL7 (erste Version, Stufen 0–2).

## 4. Getrennte Ebenen von „Skill funktioniert“

Diese Trennung trägt das Evaluationsdesign (SL1). Heute ist keine Ebene für diese Skills praktisch nachgewiesen.

| Ebene | Frage | Stand |
|---|---|---|
| Format | Erfüllt das Paket die Spezifikation? | Lokal geprüft (§2.2) |
| Repo-Discovery im Client | Kennt der Client den Skill? | Claude Code: Mechanismus *dokumentiert*, für diese Skills *offen*. Codex: *offen* |
| Auswahl im Client | Lädt der Client ihn bei passenden Aufgaben und nur dann? | *offen* (Trigger-Fixtures `not_run`) |
| Auswahl in Sidekick | Wählt Sidekicks eigene Runtime den Skill für einen Auftrag? | Existiert nicht; Gegenstand von SL3 |
| Verhalten | Hält der geladene Skill seine Assertions ein? | *offen* (Verhaltens-Fixtures `not_run`) |
| Wirkung | Wird das Ergebnis gegenüber „ohne Skill“ besser? | *offen*; keine Baseline |
| Komposition | Funktionieren Übergaben zwischen Skills? | Nicht vorgesehen; Regel gegen implizite Kaskaden gilt |
| Tool-/AskUser-Capability | Hat der Client die Werkzeuge, die der Skill erwartet? | Claude Code interaktiv: AskUser *praktisch beobachtet*. Headless: *offen* |

## 5. Owner-Vorgaben, die SL1–SL7 binden

Aus [docs/fragen/skill-library](../../docs/fragen/skill-library/index.md), beantwortet am 30.10.2026:

| Frage | Antwort | Folge |
|---|---|---|
| Live-Läufe | bis ~40 headless `claude -p`-Läufe, nur synthetische Eingaben | Budget gilt für SL5. In SL0/SL1 wurde kein Modelllauf gestartet. |
| Reichweite der ersten Version | Stufen 0–2 (Paketvertrag, Validator, Token-Zählung, Eval-Harness mit Baseline) | Zuschnitt von SL7 |
| Feedbackdaten | synthetisch plus freigegebene Repo-Artefakte | Datenweg in SL4; Splits in SL1 |
| Aktivierung | nur Owner am Kandidaten-Hash (im Repo: PR-Merge) | Aktivierungsvertrag in SL4 |

Bereits früher vorgegeben: Die Library lebt innerhalb Sidekicks ([Plan §1](library-research-plan.md#1-was-jetzt-vorgegeben-ist)).
Aus PR #11 (offen): Claude Code ist die erste Runtime. Das passt zur Wahl von Claude Code als erstem Messclient.

## 6. Abgrenzung

- Skills verleihen keine Rechte. Befugnis, Journal und Tore bleiben im Hub-Kern (V0-INV-01, -04, -07).
- Ein Skill-Kandidat ist ein Artefakt wie jedes andere. Seine Aktivierung ist ein Effekt hinter einem Tor, keine eigene Mechanik (Kern §5).
- V1 nutzt die vier Skills unverändert (Plan §1 „Priorität und Verhältnis zum MVP“). Diese Bestandsaufnahme ändert keinen Skill.

## 7. Nächster Schritt

Review dieser Bestandsaufnahme zusammen mit dem [Evaluationsdesign](library-evaluation-design.md). Danach legt der Owner den nächsten begrenzten Abschnitt fest (SL2 oder vorgezogene SL5-Baseline).
