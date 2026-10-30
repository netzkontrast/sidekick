# Synthese: Konzeptkarte und Anforderungen

Stand 2026-10-30. Grundlage sind die zwölf [Dossiers](README.md#untersuchte-repositories).
Diese Datei verdichtet deren Abschnitte „Clean-Room-Relevanz“ und bezieht die
[Web-Gegenprüfung](web-recherche-2026-10-30.md) ein (Quellen `S1`–`S12`, Anforderungen `WEB-R1`–`R10`). Sie formuliert Anforderungen in eigenen
Worten und enthält keine Texte oder Codes aus den Repos. Evidenz und Fundstellen stehen in den Dossiers.

## Kürzel

Anforderungen werden mit Repo-Kürzel und der Nummer aus dem Dossier zitiert, z. B. `PA-R2`.

| Kürzel | Repo | Kürzel | Repo |
|---|---|---|---|
| MP | [meta-prompting](repos/meta-prompting.md) (A1–A5) | SO | [skills-optimizer](repos/skills-optimizer.md) |
| APE | [automatic_prompt_engineer](repos/automatic_prompt_engineer.md) (B1–B5) | SOPT | [skill-optimization](repos/skill-optimization.md) |
| DSPY | [dspy-advanced-prompting](repos/dspy-advanced-prompting.md) (C1–C5) | SCO | [skill-cost-optimizer](repos/skill-cost-optimizer.md) |
| PA | [prompt-architect](repos/prompt-architect.md) | AHP | [agentic-harness-patterns-skill](repos/agentic-harness-patterns-skill.md) |
| PES | [prompt-engineering-skill](repos/prompt-engineering-skill.md) (eigenes Material) | RD | [recursive-decomposition-skill](repos/recursive-decomposition-skill.md) |
| CPM | [claude-prompts-mcp](repos/claude-prompts-mcp.md) | C2P | [code2prompt](repos/code2prompt.md) |
| WEB | [Web-Gegenprüfung](web-recherche-2026-10-30.md) | | |

## Querschnittsbefund

1. **Die Konzepte sind stärker als die Umsetzungen.** In fast jedem Repo gibt es eine Lücke zwischen README und
   Code. Beispiele (Belege jeweils im Dossier):
   - Ein Optimierer gibt wegen fest eingetragener Qualität immer den Ausgangsprompt zurück (DSPY).
   - Gates prüfen den gerenderten Prompt statt der Modellausgabe, und ein Ketten-Executor wird nie aufgerufen (CPM).
   - Ein Hot-Reload-Dateiwächter fehlt, obwohl die Doku ihn nennt (CPM).
   - Der Parameter `budget` in `compressContext` wird nicht genutzt (SCO).
   - Die Rekursion aus dem Paper fehlt im Code (MP).
   Ein Rewrite lohnt sich deshalb eher als eine Übernahme von Code.
2. **Messung ist die größte gemeinsame Schwäche.**
   - Verbesserungen werden auf den Trainingsdaten gemessen (SOPT).
   - Angenommene Aufgabenmischungen erscheinen als Ersparnis (SCO).
   - Wörter oder Zeilen werden als Tokens ausgegeben (SO).
   - Kennzahlen sind simuliert (DSPY).
   - „100 %“ beruht auf einem Brute-Force-Löser (MP).
   Ein Rewrite braucht von Anfang an eine eigene Evaluationsschicht.
3. **Wiederkehrendes gutes Muster:** Ein Kandidat wird erzeugt, durchläuft deterministische Prüfungen und ein
   unabhängiges Urteil und wird erst dann ausdrücklich angewendet. Am saubersten umgesetzt ist das in SO-R1–R5.
   Dasselbe Muster eignet sich für jede Art von Prompt- oder Skill-Änderung, also auch für Optimierung (SOPT-R4) und
   Meta-Operationen (MP-A3).
4. **Progressive Disclosure ist Konsens** (AHP-R2, SCO-R3, PA-R1, RD, PES). Nur Metadaten sind dauerhaft geladen,
   Details kommen bei Bedarf dazu. Messbar wird das erst mit echten Token-Budgets (SCO-R1, C2P-R3).
5. **Format, Auswahl und Wirkung sind drei verschiedene Nachweise** (WEB §1–2, S1/S2). Eine valide SKILL.md belegt
   weder, dass ein Client den Skill findet und passend lädt, noch, dass er das Ergebnis verbessert.
6. **„Meta-Prompting“ meint mehrere Verfahren** (WEB §3, S4/S5): strukturorientierte Schablonen (MP) und
   agentische Koordination über Experten-Rollen (Suzgun & Kalai, arXiv:2401.12954). Beide getrennt spezifizieren
   und messen; keine „Meta-Prompting-Engine“ als bewiesene Verbesserung annehmen.

## Konzeptkarte

Die Bausteine sind nach Fähigkeiten gegliedert. Jede Zeile ist eine Anforderung an den Rewrite und nennt die
Quellen, aus denen sie stammt.

### K1 Skill-Format und Paketierung

| ID | Anforderung | Quellen |
|---|---|---|
| K1.1 | Ein kanonisches Skill-Format (Frontmatter, Rumpf, Referenzordner). Adapter für andere Clients werden daraus generiert, nicht von Hand gepflegt. | PA-R4, RD-R5 |
| K1.2 | Ein Validator, der Frontmatter tatsächlich parst, Referenzen und Größenbudgets prüft und Pflichtlisten aus den Daten ableitet. | PA-R3, RD-R5, SCO-R3 |
| K1.3 | Zweiphasiges Laden: ein Metadaten-Katalog mit Token-Budget, der Rumpf erst bei Aktivierung. | AHP-R2, SCO-R3 |
| K1.4 | Installation ohne implizite Seiteneffekte. | PA-R5 |
| K1.5 | Discovery, Trigger, Verhalten und Regression werden je Zielclient und Version getrennt geprüft und berichtet. Ein Trigger-Test erzwingt den Skill nicht vorab. | WEB-R2, S1, S2 |

### K2 Technik-Katalog und Auswahl (Meta-Prompting-Kern)

| ID | Anforderung | Quellen |
|---|---|---|
| K2.1 | Prompt-Techniken liegen als Daten vor (ID, Absichtsklasse, Bestandteile, Rückfragen, Quelle, Evidenzgrad). | PA-R1 |
| K2.2 | Eine Weiche am Einstieg (neu erstellen, minimal optimieren, Fehler diagnostizieren), danach Klassifikation auf wenigen Achsen und zweistufige Technikwahl. Die Option „keine Technik nötig“ ist ausdrücklich vorgesehen. | PES-R1/R2, PA-R2 |
| K2.3 | Schablonen trennen Rolle, Regeln und Ausgabegerüst. Das Gerüst ist maschinenprüfbar, Beispiele sind optional. | MP-A1/A2 |
| K2.4 | Prompts als typisierte Signaturen (Ein- und Ausgabefelder, Strategie). Der Text wird aus der Signatur erzeugt. | DSPY-C1, DSPY-C2 |
| K2.5 | Meta-Operationen (entwerfen, vertiefen, kürzen, diagnostizieren) nehmen einen Prompt entgegen und geben einen Prompt zurück. Sie sind versioniert und durchlaufen die Pipeline aus K6. | MP-A3, PES-R5 |
| K2.6 | Mehrere Experten oder Personas nur mit einem ausdrücklichen Synthese- oder Dirigentenschritt. | DSPY-C5 |

### K3 Registry, Templating, Ketten und Gates

| ID | Anforderung | Quellen |
|---|---|---|
| K3.1 | Eine Registry mit Kategorien, stabilen IDs und typisierten Argumenten. `required` und die Typen werden durchgesetzt. | CPM-R1 |
| K3.2 | Templating in einer Sandbox: keine freien Includes, deklarierte Variablen, wählbarer strikter Modus. Inhalte werden für das Zielformat gekapselt. | CPM-R2, C2P-R4, APE-B5 |
| K3.3 | Ketten als deklaratives, schema-validiertes Format. Ladefehler werden gemeldet und nicht still übergangen. | CPM-R3 |
| K3.4 | Gates prüfen Modellausgaben je Schritt, mit getesteten Prüftypen und Retry-Zähler. | CPM-R4 |
| K3.5 | Hot-Reload mit atomarem Austausch und Client-Benachrichtigung. Schreibzugriffe nur über eine Pfad-Whitelist. | CPM-R5 |

### K4 Kontextaufbereitung und Zerlegung

| ID | Anforderung | Quellen |
|---|---|---|
| K4.1 | Ein Kontext-Builder mit Globs, `.gitignore`, Binärfilter, deterministischer Sortierung und standardmäßigem Secret-Ausschluss. | C2P-R1, C2P-R5 |
| K4.2 | Ein strukturierter Datensatz vor dem Rendern (Baum und Dateien mit Tokenzahl), der als Markdown, XML, JSON oder in Chunks ausgegeben werden kann. | C2P-R2 |
| K4.3 | Ein Zerlegungsmodus: messen, filtern, in Chunks teilen, parallel bearbeiten, aggregieren und gegen Belegstellen verifizieren. | RD-R1, RD-R3, AHP-R4 |
| K4.4 | Schwellen und Rekursionstiefe sind vom Harness erzwungene Parameter. Bearbeitete Segmente werden protokolliert. | RD-R2, RD-R4, DSPY-C5 |
| K4.5 | Für homogene Batch-Aufgaben einmal ein Programm erzeugen und jede Ausgabe unabhängig verifizieren. | MP-A5 |

### K5 Evaluation und Optimierung

| ID | Anforderung | Quellen |
|---|---|---|
| K5.1 | Ein Eval-Set mit getrennten Splits für Training, Entwicklung und Test, die erzwungen werden. Ergebnisse auf Trainingsdaten gelten nicht als Nachweis. | APE-B1, SOPT-R1 |
| K5.2 | Eine austauschbare Bewertungsschnittstelle (Kandidaten × Daten → Scorematrix). Metriken prüfen inhaltliche Treffer, nicht nur Länge oder Schlüsselwörter. | APE-B2, SOPT-R2 |
| K5.3 | Die Testsuite ist ein erstklassiges Artefakt mit Baseline, Regression und korrekter Statistik. Kennzahlen werden nie simuliert. | DSPY-C4, PES-R3 |
| K5.4 | Optimierer erzeugen Instruktionen aus Beispielen, führen die Kandidaten tatsächlich aus und wählen unter Budget aus (z. B. UCB). Ausgegeben werden Score und Stichprobenzahl. | APE-B1/B3, DSPY-C3 |
| K5.5 | Rohergebnisse (Modell, Version, Seed, n, Einzelwerte) werden maschinenlesbar gespeichert. Berichte entstehen nur daraus. | SOPT-R3, MP-A4 |
| K5.6 | Eine einzige, versionierte Qualitätsrubrik und eine Anti-Pattern-Liste als prüfbare Regeln. | PES-R3/R4 |
| K5.7 | Jeder Lauf bindet Skill-, Referenz-, Modell-, Client- und Eval-Version. Baseline und Kandidat laufen mit gleicher Runtime, gleichen Tools und gleichen Eingaben; je Vergleich wird nur eine Maßnahme verändert. | WEB-R1, WEB §4, SOPT-R5 |
| K5.8 | Optimierer als austauschbarer Adapter (APE-artige Induktion, feedbackbasiert wie GEPA, DSPy-Optimierer), der nur Kandidaten liefert. | WEB-R3, S3, S6–S8 |

### K6 Sichere Änderung von Prompts und Skills

| ID | Anforderung | Quellen |
|---|---|---|
| K6.1 | Jede Kompression, Optimierung oder Meta-Operation erzeugt nur einen Kandidaten. Die Quelle ändert sich nur durch einen ausdrücklichen Apply-Befehl. | SO-R1, SOPT-R4 |
| K6.2 | Ein an den Hash der Quelle gebundenes Inventar dessen, was erhalten bleiben muss (Literale und Konzepte). | SO-R2 |
| K6.3 | Deterministische Gates laufen getrennt von einem semantischen Urteil in eigenem Kontext, das Belegstellen liefern muss. | SO-R3 |
| K6.4 | Schreiben ist atomar, mit Backup, Manifest und Compare-and-swap. Restore ist nur bei passenden Hashes erlaubt. Endzustände sind fail-closed. | SO-R4/R5 |
| K6.5 | Eine Edit-Historie (was, warum, Messwert) und Abbruchbedingungen für rekursive Verfeinerung. | MP-A4, PES-R5 |
| K6.6 | Kandidaten und Ergebnisse sind begrenzt aufbewahrt und reversibel; die Übernahme ist an Hashes gebunden. | WEB-R9, SO-R4 |

### K7 Kosten und Budgets

| ID | Anforderung | Quellen |
|---|---|---|
| K7.1 | Echte Token-Zählung über eine austauschbare Tokenizer-Schnittstelle. Schätzungen sind gekennzeichnet. | SCO-R1, C2P-R3 |
| K7.2 | Eine versionierte Preistabelle mit Quelle und Datum. Vor teuren Läufen gibt es einen Kostenvoranschlag mit Freigabeschwelle. | SCO-R1, APE-B4 |
| K7.3 | Kontext-Budgets mit Kürzungshinweis. Kompression schützt definierte Klassen. | AHP-R3, SCO-R4 |
| K7.4 | Die Modellwahl ist eine Richtlinie auf Harness-Ebene, mit Begründung im Log und Qualitäts-Eval vor jeder Herabstufung. | SCO-R2 |
| K7.5 | Ersparnis gilt nur, wenn sie in einem Vorher-Nachher-Lauf derselben Aufgabe gemessen wurde. | SCO-R5 |
| K7.6 | Tatsächliche Usage (inkl. Cache-Lesen/-Schreiben), Schätzung und unbekannte Kosten werden getrennt ausgewiesen. Bei Abo-Runtimes bleiben fehlende Kosten „unbekannt“. | WEB-R6, S9, S10 |
| K7.7 | Kosten werden pro akzeptiertem Ergebnis über den ganzen Auftrag gerechnet: Metadaten, Referenzen, Ausgabe, Nacharbeit und Optimierungsaufwand. | WEB-R7 |

### K8 Harness-Grenzen

| ID | Anforderung | Quellen |
|---|---|---|
| K8.1 | Ein Freigabe-Gate je Tool-Aufruf (erlauben, fragen, verweigern), fail-closed, mit dokumentierter Rangfolge der Regelquellen (verweigern vor fragen vor erlauben). | AHP-R1, S11 |
| K8.2 | Delegation mit begrenzter Tiefe und eingeschränkten Tools. Die Synthese bleibt beim Koordinator. | AHP-R4 |
| K8.3 | Getrennte Speicherschichten (kuratiert und agentgeschrieben). Kuratierte Regeln werden nur mit Freigabe übernommen. | AHP-R5 |
| K8.4 | Hooks nur in vertrautem Workspace, mit klarer Exit-Code-Semantik. | AHP-R6, S12 |
| K8.5 | Kritische Rechte- und Antwortregeln sind harte Regressionstests: Ein Timeout erzeugt keine Zustimmung, fremde Inhalte ändern keine Rechte, Skill-Empfehlungen verleihen keine Ausführungsrechte. | WEB-R8, WEB §6 |

K8 berührt die Agent-Hub-Recherche (`research/agent-hub/`) und deren Entscheidungstore. Hier wird K8 nur als
Schnittstelle erfasst und nicht doppelt geplant.

K8.1 und K8.4 sind durch öffentliche Claude-Code-Dokumentation (S11, S12) gedeckt. Interne Details aus AHP
(Dispatcher, feste Kontextquoten, Memoisierung, Rekursionstiefen) bleiben aus der normativen Spec heraus,
bis eine unbedenkliche Quelle oder ein eigener Versuch sie trägt (WEB-R10).

## Widersprüche zwischen den Quellen

| Thema | Spannung | Vorschlag |
|---|---|---|
| Rekursionstiefe | RD empfiehlt mehrstufige Rekursion, AHP begrenzt Forks auf eine Ebene. | Die Tiefe ist ein Harness-Parameter (K4.4). Standard ist 1; mehr nur mit ausdrücklicher Konfiguration und Messung. |
| Qualitätsrubrik | PES enthält drei unterschiedliche Rubriken, PA hat eine eigene Bewertung. | Eine Rubrik spezifizieren (K5.6). Weil PES dein eigenes Material ist, kann sie dort als Ausgangspunkt dienen. |
| Modellwahl | SCO legt sie in den Skill, die Harness-Sicht legt sie in die Laufzeit. | Harness-Ebene (K7.4). |
| Schlüsselwort-Heuristiken | PA und SCO nutzen sie zur Klassifikation. Lokal gemessen ordnete die PA-Heuristik 3 von 12 Demo-Prompts falsch zu. | Nur als Nebensignal. Die Klassifikation wird gegen das Eval-Set geprüft (K5). |

## Was kein Repo abdeckt

- Ein Conductor-/Experten-Muster als echte Implementierung. Das Original von Suzgun & Kalai (S5) ist in MP nicht enthalten.
- Verhaltensbasierte Evaluation von Skills im Client: Wird der Skill ausgewählt, und verbessert er das Ergebnis?
- Ein einheitliches Datenmodell, das Technik-Katalog, Registry, Eval-Set und Änderungshistorie verbindet.

## Fortschreibung nach SL0–SL5 (Skill-Library)

> Stand 30.10.2026 · SL6 im [Library-Research-Plan](library-research-plan.md) · Branch `research/learnable-skill-library` bei `06869bc`.
> Grundlage: [SL0](library-inventory.md), [SL1](library-evaluation-design.md), [A01–A09](library-inventory.md#3-neun-bereiche-zuordnung) (`area-*.md`), [SL3](library-composition.md), [SL4](library-learning.md),
> [SL5-Teilergebnis C0/E1](eval-runs/C0-E1-ergebnis-2026-10-30.md), [Skill-Review](skill-review-2026-10-30.md), [V0-Spec](../../docs/spec/v0-ziel-und-vertraege.md) (gemergt mit PR #8; gegenüber dem von SL3 gelesenen Stand `2c4733e0` unverändert, per `git diff` geprüft).
> Status und nächste Schritte stehen nur im Plan (§8). Dieser Abschnitt ordnet zu und empfiehlt; er entscheidet nichts.
> Evidenz wie in `AGENTS.md`. Zusätzlich: *Vorgabe* = Owner-Antwort, *Vorschlag* = eigene Anforderung ohne Messung, *lokal geprüft* = eigenes Skript an den Dateien.
> *Praktisch nachgewiesen* steht hier nur für die Befunde aus C0 und E1-Auswahl laut Ergebnisdokument.

### F1. Zuordnung der K1–K8/WEB-Anforderungen mit Library-Bezug

Urteile: **zugeordnet** (von einem SL-Ergebnis abgedeckt), **ergänzt** (übernommen und präzisiert oder erweitert), **verworfen** (in dieser Form nicht Teil der Library, mit Grund).

| ID | Urteil | Library-Fassung bzw. Begründung | Beleg | Evidenz |
|---|---|---|---|---|
| K1.1 | zugeordnet | Portables SKILL.md-Paket, Laufzeitdaten als Registry-Datensatz daneben; `agents/openai.yaml` künftig generiert | SL3 §2 | Format 8/8 *lokal geprüft* (Review); Claude-Zugang per Symlink in C0 *praktisch nachgewiesen*; Generator *offen* |
| K1.2 | zugeordnet | Validator in Stufe 1 der ersten Version | SL0 §2.3, SL7 | Nur Ad-hoc-Skripte *lokal geprüft*; kein Validator im Repo |
| K1.3 | ergänzt | Drei Ladestufen (Katalog, Rumpf, Referenzen); kritische Regeln nie still gekürzt | SL3-R06/R07 | Mechanik im Client *dokumentiert*; Katalogkosten der acht Beschreibungen *offen* (Review O2) |
| K1.4 | ergänzt | „Installation“ ist im Repo eine Aktivierung: Symlink plus implizite Auswahl. Sie geschieht nur durch den Owner am Hash per PR-Merge | SL4 §5, Review B1 | *Vorgabe*; Durchsetzung *offen* |
| K1.5 | ergänzt | Ebenen M0–M5 und R getrennt; Repo-Discovery und Sidekick-Auswahl getrennt; manuelles Lesen einer SKILL.md als eigene Kategorie | SL1 §2, §4 | Discovery und Auswahl im Client *praktisch nachgewiesen* (C0/E1, Diagnose); Verhalten und Wirkung *offen* |
| K2.1–K2.3, K2.5, K2.6 | verworfen | Ein Technik-Katalog mit Weiche ist keine Library-Anforderung: Die Skills wählen ihr Vorgehen selbst, kein Bereich A01–A09 braucht ihn, und für seinen Nutzen gibt es keinen Beleg. Kann als eigener, gemessener Vorschlag zurückkommen | SL0 §3, SL3 §11 | – |
| K2.4 | ergänzt | Typisierte Ein-/Ausgaben als Übergabeartefakte mit Typversion. Der Teil „Text wird aus der Signatur erzeugt“ ist verworfen; Skilltext bleibt Prosa | SL3 §4 | *Vorschlag* |
| K3.1 | zugeordnet | Registry mit stabiler `skill_id`, `inputs`/`outputs`, `requires_capabilities` | SL3 §2 | *Vorschlag*; Format offen (O-2) |
| K3.2 | verworfen | Skills werden nicht gerendert; es gibt keine Variablen. Fremdinhalte gelten als Daten (SL3 §8, R-02) | SL3 §8 | – |
| K3.3 | zugeordnet | L2-Ablauf als Daten; Zyklus, falsche Ausgabe und inkompatible Version werden vor dem Start abgelehnt | SL3 §3, F01–F03 | *Vorschlag*; ob L2 eigenes Artefakt wird, ist offen (O-4) |
| K3.4 | ergänzt | Übergabeprüfung der Pflichtfelder deterministisch, Inhalt per Rubrik; Wiederholung nur ausdrücklich, kein automatischer Retry-Zähler | SL3 §4, F02/F04 | *Vorschlag* |
| K3.5 | verworfen | Hot-Reload widerspricht der Versionsbindung: Laufende Runs wechseln nie still, neue Freigaben erscheinen als „verfügbar“. Der Teil „Schreiben nur über Pfadgrenze“ ist in SL4 §5.2 zugeordnet | SL3-R02/R10 | – |
| K4.1, K4.2 | zugeordnet (teilweise) | Nur als Inhalt des `context-package` von resuming-work; ein Kontext-Builder ist nicht Teil der ersten Version | SL3 §4, A06 | *Vorschlag* |
| K4.4 | zugeordnet | Skill→Skill-Tiefe 0, Delegationstiefe Standard 1 | SL3-F06 | *Vorschlag* |
| K5.1 | ergänzt | Splits dev/select/test nach Ursprungsfamilie; Pflichtregression R außerhalb der Splits; Test-Split nach einmaliger Nutzung verbraucht | SL1 §5.5, SL4 §4 | Spezifiziert; Zugriffstrennung nicht implementiert |
| K5.2, K5.3 | zugeordnet | Metriken je Ebene; Fixtures `skill-evaluation.json` und `grilling-evaluation.json` als Artefakt; Vergleichsbericht von evaluating-changes | SL1 §7, A08 | Rubriken je Skill fehlen (*offen*) |
| K5.4, K5.8 | zugeordnet | Optimierer liefern nur Kandidaten im Zustand `vorgeschlagen`; ihre interne Validierung ersetzt nie den Test. Adapter und Dependency zurückgestellt, bis ein manueller Kandidat gemessen ist | SL4 §2.1, §4 | *Vorschlag* |
| K5.5 | zugeordnet | Rohspuren normalisiert unter `eval-runs/`, Start-Ledger, Berichte nur daraus | SL1 §8, [ledger.json](eval-runs/ledger.json) | Für C0/E1 liegen Rohspuren vor |
| K5.6 | ergänzt | Eine versionierte Rubrik **je Skill**; Rubrikänderung nur in eigenem PR mit neuer `rubrik_version`, Vergleiche über Versionen ungültig | SL4 §8 | Rubriken noch nicht geschrieben (*offen*) |
| K5.7 | zugeordnet | Run-Manifest mit Skill-, Referenz-, Ablauf-, Client- und Modellangaben; B1 mit Paket-Hash eingefroren | SL3-R01, [Baseline v2](skill-pilot-baseline-v2.json) | Modell und Usage im Lauf gemeldet: *praktisch nachgewiesen* (C0) |
| K6.1 | ergänzt | Kandidat liegt nie unter `.agents/skills/` (Invariante L1). Manuelle Änderungen ohne Lauf sind ungemessene Owner-Vorlagen, keine übersprungene Messung | SL4 §4 | SL2 hat diesen Weg genommen (Review S1) |
| K6.2, K6.3, K6.5 | zugeordnet | Inventar im Schritt `dev_geprueft`; Rollen Autor/Auswerter/Owner; Zustände samt Grund als Historie | SL4 §4 | *Vorschlag* |
| K6.4, K6.6 | ergänzt | Im Repo: Compare-and-swap = Hashgleichheit vor und nach dem Merge, Restore = Revert durch den Owner; Kandidat `veraltet` bei Baseline-Drift | SL4 §4, §5 | Drift *lokal geprüft* (9 von 13 Pilotdateien durch SL2 geändert) |
| K7.1 | zugeordnet | Token-Zählung in Stufe 1; bis dahin Bytes/Wörter | SL0 §2.1 | Client meldet Token-Usage: *praktisch nachgewiesen* (C0); eigener Tokenizer *offen* |
| K7.2 | ergänzt | Freigabeeinheit sind CLI-Starts (~40); alle Starts inkl. Fehlversuche im Ledger. USD-Werte bei Abo-Anmeldung sind Client-Schätzungen | SL1 §9, C0/E1 §1 | 14 von ~40 Starts verbraucht; ~1,48 USD laut Client geschätzt |
| K7.3, K7.4, K7.5, K7.7 | zugeordnet | Kontextbudget ohne stille Kürzung; Modell steht im Manifest, nicht im Skill; keine Ersparnis ohne M4; Kosten je akzeptiertem Ergebnis über den ganzen Ablauf | SL3-R07, §8; SL1 §7 | Keine Ersparnis behauptet |
| K7.6 | zugeordnet | Usage, Schätzung und Unbekanntes getrennt | SL1 §8 | Felder Input, Output, Cache-Lesen/-Schreiben, Thinking, `total_cost_usd`: *praktisch nachgewiesen* (C0) |
| K8.1, K8.2 | zugeordnet | Skills empfehlen, der Harness erzwingt (Schnittstelle zum Hub-Kern, dort geplant) | SL3-R08, F06 | *Vorschlag* |
| K8.3 | zugeordnet | A09 nur als `memory-candidate` mit `trainingsfreigabe: false`; Skill zurückgestellt | A09 §9, SL4 §3 | *Vorschlag* |
| K8.5 | ergänzt | R-01…R-05 als Pflichtregression. Ohne AskUser im headless Lauf muss R-01 auch im Chat-Fallback gelten (Fall B12h) | SL1 §5.4, C0 | AskUser headless fehlt: *praktisch nachgewiesen*; Einhaltung von R-01 *offen* |
| WEB-R1, R3, R4, R6–R9 | zugeordnet | Deckungsgleich mit K5.7, K6.1, K5.1, K7.6, K7.7, K8.5, K6.6. Für R4 zusätzlich: E1-Fälle wurden vor dem ersten Start committet ([e1-auswahl-plan.json](eval-runs/e1-auswahl-plan.json)) | wie dort | wie dort |
| WEB-R2 | ergänzt | wie K1.5 | C0/E1 | wie K1.5 |
| WEB-R5 | zugeordnet | Inhaltliche Assertions je Fall; Erfolg nie aus Länge oder Judge-Prosa | SL1 §7, SL4 §2.1 | *offen* (keine M3/M4-Läufe) |
| WEB-R10 | zugeordnet | C0/E1 stützen sich nur auf öffentliche CLI-Hilfe und eigene Läufe; AHP-Interna bleiben ausgeschlossen | [Clean-Room-Plan](clean-room-plan.md#stand-nach-sl0sl5) | – |

Ohne Library-Bezug und hier nicht bewertet: K4.3, K4.5 (Zerlegung, Batch-Programme) und K8.4 (Hooks). Sie bleiben fachliche Referenz im Clean-Room-Plan.

### F2. Neue Anforderungen aus SL2–SL5

| ID | Anforderung | Herkunft | Evidenz |
|---|---|---|---|
| KL-01 | Identität eines Skills ist sein Inhaltshash; ein Versionslabel mit anderem Hash ist ein Fehler. Registry-Einträge ändern den Paket-Hash nie. | SL3 §2, R03 | *Vorschlag*; Kanonisierung offen (O-1) |
| KL-02 | Projektkonfiguration (Ablagen, ID-Schemata, Statusquelle) steht in den Projektregeln, nie im portablen Skill. | A01, SL3 §2 | *lokal geprüft*: grep auf Projektbegriffe in allen Skill-Dateien 0 Treffer (Review) |
| KL-03 | Übergaben zwischen Skills laufen als typisierte Artefakte per Referenz mit Hash; der Verbraucher prüft Typ, Typversion und Pflichtfelder vor Arbeitsbeginn. | SL3 §4 | *Vorschlag* |
| KL-04 | Beziehungen `requires`, `alternative`, `recommends` sind verschieden; `recommends` wird nie automatisch ausgeführt, und kein Skill lädt einen anderen. | SL3 §3, A06 (Review S3) | *Vorschlag*; Kaskadenfreiheit in Spuren *offen* |
| KL-05 | Ein Run pinnt alle Versionen im Manifest; offline laufen nur lokal vorhandene, freigegebene Hashes; Versionskonflikte werden sichtbar und vom Owner gelöst. | SL3-R01/R02/R09/R10 | *Vorschlag* |
| KL-06 | Jeder Kompositionsfehler (Zyklus, falsche Ausgabe, Version, Teilfehler, Abbruch, Tiefe, Capability) endet in einem eigenen Zustand; keiner zählt als Erfolg. | SL3 §6 | *Vorschlag* |
| KL-07 | Vor jeder Messreihe werden die Capabilities je Client und Version nachgewiesen. Optionale Capabilities haben einen im Skill dokumentierten Fallback, der als solcher markiert wird. | SL1 §4, SL3-R05, C0 | *praktisch nachgewiesen*, dass der Nachweis nötig ist: AskUser fehlt headless, eingebaute Client-Skills bleiben trotz `--setting-sources project` sichtbar |
| KL-08 | Auswahl wird aus der Ereignisspur gemessen und unterscheidet „vom Client ausgewählt“, „manuell gelesen“ und „nicht geladen“; B0 läuft isoliert ohne Skill-Dateien. | SL1 §4 | *praktisch nachgewiesen*: Skill-Aufruf als Werkzeugereignis sichtbar, B0 ohne Skill-Werkzeug, 0 von 12 manuellen Lesezugriffen |
| KL-09 | Auswahlfälle brauchen das Material, auf das sich der Prompt bezieht; Platzhalter-Prompts messen eher „direkt antworten“ als Auswahl. | C0/E1 §3 | Beide E1-Verfehlungen hatten Platzhalter (*praktisch beobachtet*); die Ursache ist *offen* |
| KL-10 | Ein Kandidat wird `veraltet`, sobald der aktive Baseline-Hash von seiner Baseline abweicht; Neubindung erzeugt einen neuen Kandidaten. | SL4 §4 | Drift *lokal geprüft* |
| KL-11 | Aktivierung und Rücknahme nur durch den Owner am Kandidaten-Hash, im Repo per PR-Merge bzw. Revert; ein Aktivierungs-PR ändert nie Rubrik, Fälle, Splits oder Judge. | SL4 §5, §8 | *Vorgabe* (Q-20261030-sl-aktivierung) plus *Vorschlag* |
| KL-12 | Feedbackfälle nur aus synthetischen Fällen und freigegebenen Repo-Artefakten mit Feedback-Manifest; ein korrigierter oder zurückgezogener Erinnerungseintrag sperrt abgeleitete Fälle für neue Nutzung. | SL4 §3 | *Vorgabe* plus *Vorschlag* |
| KL-13 | Alle Starts zählen gegen das freigegebene Budget, auch Fehlversuche; die Fallauswahl wird vor dem ersten Start versioniert. | SL1 §9, [ledger.json](eval-runs/ledger.json) | Für C0/E1 so durchgeführt |
| KL-14 | Was ohne Modell prüfbar ist, wird Code: Fragen-Konsistenz (A01), Fundstellen (A02), Paketfelder (A03), Entscheidungsregister (A04), ID-Rückverfolgbarkeit (A05), Diff/Hash beim Fortsetzen (A06), Contract-Tests (A07), Eval-Harness (A08), Erinnerungszustände (A09). | `area-*.md` §9/§10, SL3 §12 | *Vorschlag* |
| KL-15 | Empfehlung, Entscheidung und Ausführungsbefugnis sind getrennte Ausgabefelder; „entscheidungsreif“ und „zur Aktivierung vorlegen“ sind keine Entscheidung. | A04, SL3 §8 | *Vorschlag*; Skilltext geändert, Verhalten *offen* |

### F3. Was praktisch nachgewiesen ist und was nicht

Nur diese Befunde tragen die Stufe *praktisch nachgewiesen* ([Ergebnis](eval-runs/C0-E1-ergebnis-2026-10-30.md) §2–§3; Claude Code headless, Modell laut Spur `claude-opus-5-5`, B1 = acht Skills, Einzelstarts):

- In B1 sind alle acht Projekt-Skills sichtbar, in B0 keiner. Eingebaute Client-Skills und drei Plugins bleiben in beiden sichtbar.
- Ein Skill-Aufruf erscheint als Ereignis des `Skill`-Werkzeugs; M2 ist damit deterministisch messbar. Auto-Auswahl ohne ausdrücklichen Aufruf kommt vor (GT-01).
- Ein AskUser-Werkzeug gibt es im headless Lauf nicht.
- Die Usage-Felder werden geliefert (siehe K7.6).
- E1-Auswahl: 8 von 10 positiven Fällen richtig, 2 von 2 negativen ohne Skill, Konkurrenzfall RW-N1 wie erwartet, 0 manuelle Lesezugriffe.

Nicht nachgewiesen: Verhalten (M3), Wirkung gegenüber B0 oder B1-alt (M4), Komposition (M5/E2), ein Lernschritt (E3), Holdout-Fälle, Wiederholungen, andere Modelle, Clients (Codex) oder Clientversionen. „Gewählt“ heißt nicht „gut ausgeführt“.

### F4. Empfehlung gegenüber dem Status quo

Verglichen werden **S0**: die vier Skills unverändert (B1-alt, main `38333a4`), und **S1**: die jetzige Suite aus acht Skills (B1, Paket-Hash `4ad5b6dbae228982…`, Quellcommit `d0cf27cd`).

**Empfehlung: S1 statt S0 als Arbeitsstand und Baseline der Library.** Gründe:
1. S1 behebt belegte Mängel von S0 ohne Lauf: Projektbindung im Grilling-Skill, unvollständige bzw. widersprüchliche Fixtures (B06, B10), fehlende Konkurrenz- und Negativfälle. Format ist 8/8 *lokal geprüft*.
2. Nur S1 ist überhaupt gemessen: Discovery und Auswahl aller acht Skills, jeder neue Skill in seinem positiven Fall gewählt, keine Fehlauswahl in den Negativfällen. Für S0 gibt es keine Läufe.
3. Ein Rückfall auf S0 würde die eingefrorene, in C0/E1 genutzte Baseline wechseln; die verbleibenden ~26 Starts (E1-Verhalten, M4, E2) müssten dann neu geplant werden.

**Aktivierung** im Hauptzweig ist Sache des Owners am Hash (Merge). Empfohlen wird, im PR die Hashes je Skill zu nennen und S1 ausdrücklich als *ungemessen in Verhalten und Wirkung* zu kennzeichnen (SL4 §4). Für zwei Skills sind die eigenen Aktivierungsbedingungen nicht erfüllt: testing-system-boundaries („erst nach dem Minimalversuch“, A07 §9) und resuming-work („nicht aktiv, nicht geprüft“, A06 §11). Der Owner vermerkt entweder ausdrücklich, dass er sie übersteuert, oder hält beide bis zu ihrem E1-Verhaltensfall als Kandidaten zurück (Symlink entfernen, implizite Auswahl aus). Der zweite Weg ändert den Messbestand; E1-Ergebnisse gelten dann für B1, nicht für den neuen Stand. Für specifying-behavior ist die Bedingung „nach Review der Spec-Konvention aus PR #8“ formal erfüllt, weil PR #8 gemergt ist.

**Grenzen der Empfehlung:**
- S0 → S1 ändert viele Dimensionen zugleich. Ein Qualitätsvorteil ist weder messbar zuzuschreiben noch gemessen (Review S1). Die Empfehlung beruht auf behobenen Mängeln und Auswahlbefunden, nicht auf besseren Ergebnissen.
- Ein Modell, ein Client, Einzelstarts, öffentliche Fälle, kein Holdout: diagnostisch, nicht statistisch belastbar.
- Mehr Skills kosten Katalogkontext: Die vier neuen Beschreibungen haben zusammen etwa 2 450 Zeichen, die alten etwa 1 150 (Review O2). Die Wirkung auf das Katalogbudget ist ungemessen.
- V1 hängt nicht davon ab: Die Hub-Abnahme kann die vier Skills unverändert nutzen (Plan §1). Diese Empfehlung erweitert die V1-Abnahme nicht.

### F5. Folgen für die Querschnittsbefunde oben

- Befund 5 (Format, Auswahl, Wirkung getrennt) ist für Format und Auswahl jetzt belegt; Wirkung bleibt offen.
- Widerspruch „Rekursionstiefe“: in der Library aufgelöst durch SL3-F06 (Skill→Skill-Tiefe 0, Delegation Standard 1).
- „Was kein Repo abdeckt“: Für verhaltensbasierte Evaluation im Client liegt die Auswahlhälfte als Diagnose vor. Ein einheitliches Datenmodell gibt es als Entwurf (SL3 §2–§4, SL4 §3–§4); geprüft ist es nicht.
