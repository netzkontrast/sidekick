# Synthese: Konzeptkarte und Anforderungen

Stand 2026-10-30. Grundlage sind die zwölf [Dossiers](README.md#untersuchte-repositories).
Diese Datei verdichtet deren Abschnitte „Clean-Room-Relevanz“. Sie formuliert Anforderungen in eigenen
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

### K6 Sichere Änderung von Prompts und Skills

| ID | Anforderung | Quellen |
|---|---|---|
| K6.1 | Jede Kompression, Optimierung oder Meta-Operation erzeugt nur einen Kandidaten. Die Quelle ändert sich nur durch einen ausdrücklichen Apply-Befehl. | SO-R1, SOPT-R4 |
| K6.2 | Ein an den Hash der Quelle gebundenes Inventar dessen, was erhalten bleiben muss (Literale und Konzepte). | SO-R2 |
| K6.3 | Deterministische Gates laufen getrennt von einem semantischen Urteil in eigenem Kontext, das Belegstellen liefern muss. | SO-R3 |
| K6.4 | Schreiben ist atomar, mit Backup, Manifest und Compare-and-swap. Restore ist nur bei passenden Hashes erlaubt. Endzustände sind fail-closed. | SO-R4/R5 |
| K6.5 | Eine Edit-Historie (was, warum, Messwert) und Abbruchbedingungen für rekursive Verfeinerung. | MP-A4, PES-R5 |

### K7 Kosten und Budgets

| ID | Anforderung | Quellen |
|---|---|---|
| K7.1 | Echte Token-Zählung über eine austauschbare Tokenizer-Schnittstelle. Schätzungen sind gekennzeichnet. | SCO-R1, C2P-R3 |
| K7.2 | Eine versionierte Preistabelle mit Quelle und Datum. Vor teuren Läufen gibt es einen Kostenvoranschlag mit Freigabeschwelle. | SCO-R1, APE-B4 |
| K7.3 | Kontext-Budgets mit Kürzungshinweis. Kompression schützt definierte Klassen. | AHP-R3, SCO-R4 |
| K7.4 | Die Modellwahl ist eine Richtlinie auf Harness-Ebene, mit Begründung im Log und Qualitäts-Eval vor jeder Herabstufung. | SCO-R2 |
| K7.5 | Ersparnis gilt nur, wenn sie in einem Vorher-Nachher-Lauf derselben Aufgabe gemessen wurde. | SCO-R5 |

### K8 Harness-Grenzen

| ID | Anforderung | Quellen |
|---|---|---|
| K8.1 | Ein Freigabe-Gate je Tool-Aufruf (erlauben, fragen, verweigern), fail-closed, mit dokumentierter Rangfolge der Regelquellen. | AHP-R1 |
| K8.2 | Delegation mit begrenzter Tiefe und eingeschränkten Tools. Die Synthese bleibt beim Koordinator. | AHP-R4 |
| K8.3 | Getrennte Speicherschichten (kuratiert und agentgeschrieben). Kuratierte Regeln werden nur mit Freigabe übernommen. | AHP-R5 |
| K8.4 | Hooks nur in vertrautem Workspace, mit klarer Exit-Code-Semantik. | AHP-R6 |

K8 berührt die Agent-Hub-Recherche (`research/agent-hub/`) und deren Entscheidungstore. Hier wird K8 nur als
Schnittstelle erfasst und nicht doppelt geplant.

## Widersprüche zwischen den Quellen

| Thema | Spannung | Vorschlag |
|---|---|---|
| Rekursionstiefe | RD empfiehlt mehrstufige Rekursion, AHP begrenzt Forks auf eine Ebene. | Die Tiefe ist ein Harness-Parameter (K4.4). Standard ist 1; mehr nur mit ausdrücklicher Konfiguration und Messung. |
| Qualitätsrubrik | PES enthält drei unterschiedliche Rubriken, PA hat eine eigene Bewertung. | Eine Rubrik spezifizieren (K5.6). Weil PES dein eigenes Material ist, kann sie dort als Ausgangspunkt dienen. |
| Modellwahl | SCO legt sie in den Skill, die Harness-Sicht legt sie in die Laufzeit. | Harness-Ebene (K7.4). |
| Schlüsselwort-Heuristiken | PA und SCO nutzen sie zur Klassifikation. Lokal gemessen ordnete die PA-Heuristik 3 von 12 Demo-Prompts falsch zu. | Nur als Nebensignal. Die Klassifikation wird gegen das Eval-Set geprüft (K5). |

## Was kein Repo abdeckt

- Ein Conductor-/Experten-Muster als echte Implementierung. Das Original von Suzgun & Kalai ist in MP nicht enthalten.
- Verhaltensbasierte Evaluation von Skills im Client: Wird der Skill ausgewählt, und verbessert er das Ergebnis?
- Ein einheitliches Datenmodell, das Technik-Katalog, Registry, Eval-Set und Änderungshistorie verbindet.
