# SL4 – Lernvertrag der Skill-Library

> Stand 30.10.2026 · Ergebnis SL4 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Evidenz: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*; *Ableitung* = eigene Schlussfolgerung; *Vorgabe* = Owner-Antwort.
> Es wurde kein Modell, keine CLI und kein Fremdcode ausgeführt. Kein Kandidat wurde erzeugt, bewertet oder aktiviert. Kein Lernerfolg ist gemessen.
> Ergänzt 31.10.2026: **B1-Vorlauf in select** (§4, §6) nach Owner-Antwort A-20261031-e3-b1-vorlauf („B1-Vorlauf ist ok, führ ihn mit P2 ein“; Frage und Evidenz E3-Runde 2 §4–§5 auf Branch `research/e3-runde-2`, PR #20); Spec-Regel [SLV0-EVAL-25](../../docs/spec/skill-library-v0.md).

## 1. Zweck, Stand und Quellen

Dieser Vertrag legt fest, **wie** die Library später aus Erfahrungen lernen darf: was sich ändern darf, woher Feedback stammt,
wie ein Kandidat bis zur Aktivierung läuft und wie er zurückgenommen wird. Er setzt [SL1](library-evaluation-design.md) voraus
und ersetzt dessen Messregeln nicht. Er ist kein Auftrag für einen Optimierungslauf.

**Gelesene Stände:** Sidekick-Branch `research/learnable-skill-library` an `11580d715552db44f782676d3f578b8a383c5c94`.
Fremd-Repos nur über die Dossiers an deren SHAs: APE `5f8058c0`, dspy-advanced-prompting `facc1ad8`, skill-optimization `6fec081e`,
skills-optimizer `f8082b57`, GEPA `02ea4152`; DSPy-Doku `25162c4f` über die [Primärquellenprüfung](../../docs/research/skill-library-primaerquellen-2026-10-30.md) (P4/P5).
Owner-Vorgaben: [Feedbackdaten](../../docs/fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md), [Aktivierung](../../docs/fragen/skill-library/questions/Q-20261030-sl-aktivierung.md),
[Reichweite](../../docs/fragen/skill-library/questions/Q-20261030-sl-reichweite.md), [Live-Läufe](../../docs/fragen/skill-library/questions/Q-20261030-sl-live-laeufe.md); Index noch `awaiting_confirmation`.

**Voraussetzung SL3:** Ein [SL3-Entwurf](library-composition.md) entstand parallel und ist noch nicht committet oder reviewt. Er deklariert
Beziehungen (`requires`/`alternative`/`recommends`) und lehnt Zyklen ab. §2.3 und §5.3 stützen sich darauf nur vorläufig; nach dessen Review abgleichen.

**Neuer lokaler Befund (lokal geprüft per Hashvergleich, kein Modell):** Die eingefrorene Pilot-Baseline (`d1a04e26…`, Quellcommit `de8efef5`)
stimmt mit dem Branch nicht mehr überein. 9 von 13 eingefrorenen Dateien wurden durch SL2 geändert, vier Skills kamen hinzu.
Die Kandidaten K-DESC und K-PORTABLE sind damit an eine veraltete Baseline gebunden; die Ersetzungstexte von K-PORTABLE kommen
im aktuellen Grilling nicht mehr vor (die Projektneutralität kam per SL2-Commit `c87b158` ohne Vergleich). Folge in §4 (Zustand `veraltet`) und §6.

Nach Owner-Vorgabe umfasst die erste Implementierung nur Stufen 0–2 (Paketvertrag, Validator, Token-Zählung, Eval-Harness).
Dieser Vertrag beschreibt daher den **späteren** Lernpfad; in V1 läuft er höchstens manuell über PRs.

## 2. Vier Lernziele

Grundregel für alle vier: Ein Kandidat ändert **genau eine Dimension** gegenüber einer eingefrorenen Baseline (K5.7, WEB §4).
Ein Optimierer liefert nur Kandidaten (K5.8, K6.1, WEB-R3). Prompt-Optimierung, Regeländerung und Fine-Tuning sind getrennte Verfahren (Plan §3).

### 2.1 Inhalt

| Aspekt | Festlegung |
|---|---|
| Darf sich ändern | Instruktionsschritte, Beispiele, Referenzdateien eines Skills; Länge nur mit ausgewiesenem Zuwachs |
| Messgröße | M3 Verhalten, M4 Wirkung (gepaart gegen Baseline), R harte Regeln, Aufwand je akzeptiertem Ergebnis (K7.7) |
| Zulässige Verfahren | 1. manuelle Regeländerung mit Hypothese (Standard). 2. APE-artige Induktion aus dev-Beispielen als Adapter: Kandidaten erzeugen, tatsächlich ausführen, unter Budget wählen (APE-B1/B3, *im Code gefunden*). 3. Feedbackbasiert wie GEPA/DSPy als austauschbarer Adapter mit Train/Val an den Optimierer (*im Code gefunden*, gskill). Fine-Tuning nicht |
| Ausdrücklich nicht | Rubrik, Fälle, Splits oder Judge im selben Kandidaten ändern; harte Regeln (R-01…R-05) entfernen oder abschwächen; Rechte, Effekte oder Werkzeuge über Skilltext vergeben; Erfolg aus kürzerem Text, Loss oder Judge-Prosa ableiten |

Negativbelege für die Grenzen: skill-optimization bewertet auf den Optimierungsfällen und ändert zugleich das Modul;
dspy-advanced-prompting setzt eine feste Qualität und gibt den Ausgangsprompt zurück (beide in den Dossiers *im Code gefunden* bzw. *praktisch nachgewiesen*).

### 2.2 Auswahl

| Aspekt | Festlegung |
|---|---|
| Darf sich ändern | `description` und Trigger-Metadaten eines Skills; später explizite Auswahlregeln der Sidekick-Runtime; die Option „kein Skill“ |
| Messgröße | M2 (richtig/fälschlich ausgewählt, falscher Skill im Konkurrenzfall), M1 als Vorbedingung, R |
| Zulässige Verfahren | Manuelle Beschreibungsänderung (wie K-DESC); APE-artige Induktion von Beschreibungen aus dev-Fällen; Beschreibungsoptimierung nach Agent-Skills-Leitfaden (P2, *dokumentiert*) mit Schlussrubrik vor dem Test eingefroren; später ein lokaler Router nur über §2.4 |
| Ausdrücklich nicht | Rumpf und Beschreibung im selben Kandidaten ändern; Geräte-/Capability-Filter lernen (das ist deterministisch); Auswahl als Rechtevergabe behandeln |

### 2.3 Komposition (vorläufig bis SL3-Review)

| Aspekt | Festlegung |
|---|---|
| Darf sich ändern | Reihenfolge, Übergabeartefakte, Kontextbudget einer **explizit deklarierten** Kette |
| Messgröße | M5 je Übergabe, M4 des Endergebnisses gegen Einzelschritte, Fehlerfortpflanzung, Abbruchverhalten, Aufwand |
| Zulässige Verfahren | Nur manuelle Regeländerung an einer deklarierten Kette; Optimierer erst, wenn der SL3-Kettenvertrag reviewt und prüfbar ist |
| Ausdrücklich nicht | Implizite Skill-Kaskaden, automatisch erzeugte Ketten, Ändern mehrerer Skills plus Kette in einem Kandidaten. Außerhalb der V1-Reichweite (Stufe 4) |

### 2.4 Modellparameter

| Aspekt | Festlegung |
|---|---|
| Darf sich ändern | Später Gewichte eines kleinen lokalen Routers oder Vorschlagsmodells (Needle-Versuch N0 im Hub-Plan) |
| Messgröße | Vorteil gegenüber Regeln, Retrieval und Basismodell auf demselben unabhängigen Test; Export-, Betriebs- und Rücknahmeaufwand |
| Zulässige Verfahren | Nur als eigener, später genehmigter Versuch (§7) mit eigener Dependency- und Datenentscheidung |
| Ausdrücklich nicht | Fine-Tuning in V1 oder E3; Training aus Erinnerungen oder persönlichen Sessions; Ersatz großer Modelle für allgemeine Arbeit |

## 3. Datenwege für Feedbackfälle

**Vorgabe:** Feedback stammt nur aus synthetischen Fällen und ausdrücklich freigegebenen Repo-Artefakten (Option A). Option B (lokale Session-Transkripte) wurde nicht gewählt.

| Quelle | Zulässig? | Bedingung |
|---|---|---|
| Synthetische Fälle, als synthetisch markiert | ja | `herkunft: synthetisch`, Autor und Datum |
| Repo-Artefakte: `docs/fragen/`-Antworten, Specs, PR-Reviews | ja, nach Freigabe | Pfad und Commit, Eintrag im Feedback-Manifest, das der Owner im PR bestätigt (*Ableitung*: „freigegeben“ = gemergt **und** im Manifest) |
| Eval-Rohdaten aus SL5 (synthetische Eingaben, redigierte Spuren) | ja, nur dev/select | normalisierte Felder ohne private Denktexte und freie Ausgaben (Pilot-Normalisierer, *im Code gefunden*, lokal getestet) |
| Persönliche Rohsessions, Transkripte, `local-only`-Inhalte, Secrets | nein | weder in Git noch an Optimierungsdienste (Plan §7, V0-INV-09/-11 Entwurf) |
| Fremddaten mit unklarer Lizenz (z. B. APE-Datensätze, skill-optimization) | nein | Clean-Room-Plan; Lizenz in den Dossiers *offen* |

**Feedbackfall-Datensatz (Vorschlag):** `case_id`, `family_id`, `split`, `herkunft` (synthetisch | Pfad@Commit), `freigabe_ref`, `datenklasse`,
`signal` (Korrektur | Ablehnung | Ergebnis | Regression), `eingabe`, `assertion` (getrennt von der Eingabe, DSPy-Datenmodell P4), `erstellt_von`.

Regeln:
- Feedback ist ein Signal, kein objektives Label. Eine Korrektur wird erst durch eine menschlich formulierte Assertion zum Fall (Plan §7).
- Redaktion: Fälle referenzieren Artefakte statt sie zu kopieren; Spuren werden vor dem Commit auf Secrets und persönliche Daten geprüft (SL1 §8).
- Keine Zirkelbegründung: Ein Kandidat darf nicht auf den Fällen entstehen, die ihn später testen; eine Ablehnung desselben Kandidaten ist kein Beleg für den nächsten.
- An externe Optimierungsdienste geht nichts, solange kein Provider entschieden ist; dann nur synthetische und öffentliche Repo-Fälle (gskill-Dossier: Credential-Grenze *offen*).

**Abgrenzung zu A09:** Ein bestätigter Fakt im Gedächtnis ist kein Training und kein Feedbackfall (Plan §3).
Wissenskandidaten tragen `trainingsfreigabe: false` ([A09](area-consolidating-knowledge.md)). Ein Feedbackfall aus Wissen braucht eine eigene Freigabe.
**Entscheidungsvorschlag zur offenen A09-Frage:** Wird ein Erinnerungseintrag korrigiert oder zurückgezogen, sperrt der Kern daraus
abgeleitete Feedbackfälle deterministisch für jede **neue** Nutzung. Bereits erzeugte Ergebnisse bleiben als Historie mit Markierung;
darauf gestützte Aktivierungen werden prüfpflichtig.

## 4. Kandidatenlebenszyklus

**Rollen:** *Autor* (Mensch, Agent oder Optimierer-Adapter) sieht nur dev. *Auswerter* (deterministischer Harness plus Skill `evaluating-changes`)
sieht select; test erst nach der Auswahl. *Owner* aktiviert und nimmt zurück. Ein Autor bewertet seine Varianten nie allein (SL1 §11).

**Invariante L1:** Ein Kandidat ist ein Datensatz aus Ersetzungen plus Baseline-Hash (Form wie [skill-pilot-candidates.json](skill-pilot-candidates.json)).
Er liegt nie unter `.agents/skills/` und wird von keinem Client geladen, bis er aktiv ist. Der Pilot-Helfer lehnt fremde Baselines,
nicht eindeutige Ersetzungen und Beschreibungskandidaten mit mehr als einer Zeile ab (*im Code gefunden*, `variant_files`).

| Von → Nach | Auslöser | Autorität | Beleg |
|---|---|---|---|
| – → `vorgeschlagen` | Hypothese aus dev-Feedback | Autor | Kandidatendatensatz, Baseline-Hash, Dimension, Hypothese |
| `vorgeschlagen` → `dev_geprueft` | dev-Läufe + statische Prüfung (M0, Inventar K6.2) | Auswerter | Rohdaten dev, Validator-Ergebnis |
| `dev_geprueft` → `zurueckgestellt` | B1-Vorlauf: B1 erfüllt das Kernkriterium in **allen** select-Fällen des Kandidaten (`nicht_trennend`), und keine trennende Familie liegt vor | Auswerter | B1-Rohdaten select, Kernurteile, `eval nullrun --b1-kern` (SLV0-EVAL-25); Grund „zurückgestellt, Familie nicht trennend“; 0 Kandidatenstarts |
| `zurueckgestellt` → `dev_geprueft` | eine getrennte Session hat eine neue select-Familie geschrieben; der B1-Vorlauf beginnt auf ihr neu | Auswerter | neue Familie im Split-Manifest, Autor ≠ Kandidatenautor |
| `dev_geprueft` → `ausgewaehlt` | B1-Vorlauf `trennend` (B1 verfehlt den Kern in mindestens einem select-Fall), danach bester Kandidat auf select innerhalb Budget | Auswerter | B1-Vorlauf und select-Rohdaten; Auswahl mit Kandidatenhash vor Testzugriff protokolliert |
| `ausgewaehlt` → `getestet` | einmaliger gepaarter Test B1 vs. Kandidat + Pflichtregression | Auswerter | test-Rohdaten; Split danach `verbraucht` |
| `getestet` → `vorgelegt` | vorab festgelegte Schwelle erfüllt, 0 R-Verstöße | Auswerter empfiehlt | Vergleichsbericht ([A08](area-evaluating-changes.md)), Rücknahmeplan |
| `vorgelegt` → `aktiv` | PR-Merge | **nur Owner** am Hash | Merge-Commit; Hashgleichheit nach §5 |
| `aktiv` → `beobachtet` | Beobachtungsfenster beginnt | deterministisch | Fenster und Prüfsuite vor Aktivierung festgelegt |
| `aktiv`/`beobachtet` → `zurueckgenommen` | Owner-Entscheidung, z. B. nach R-Verstoß | **nur Owner** | Revert-Commit; aktiver Hash = Vorgängerhash |
| jeder Zustand vor `aktiv` → `verworfen` | Schwelle verfehlt, Leck, zwei Dimensionen, R-Verstoß | Auswerter oder Owner | Grund im Bericht; „kein Vorteil“ ist gültig |
| jeder Zustand vor `aktiv` → `veraltet` | aktive Baseline-Hash ≠ Kandidat-Baseline | deterministisch | Hashvergleich; Neubindung = neuer Kandidat ab `vorgeschlagen` |

Weitere Regeln:
- **B1-Vorlauf in select** (Owner-Freigabe 31.10.2026, Spec SLV0-EVAL-25; E3-Form der Nulllauf-Trennschärfe SLV0-EVAL-23):
  1. Vor jedem Kandidatenstart läuft nur B1 auf den select-Fällen des Kandidaten.
  2. Die B1-Ausgaben werden anonymisiert und **absolut nur am Kernkriterium** bewertet, nicht paarweise: mit dem deterministischen Prüfer des Falls, sonst
     durch eine getrennte Bewerter-Session mit Belegprüfung (`eval judge check`, SLV0-EVAL-21).
  3. Erfüllt B1 den Kern in allen select-Fällen, ist die Familienmenge `nicht_trennend`, bevor ein Kandidat startet. Dann schreibt eine getrennte Session eine
     trennende Familie, oder der Kandidat geht nach `zurueckgestellt`. In select startet der Kandidat in diesem Fall nicht.
  4. Verfehlt B1 den Kern in mindestens einem select-Fall (`trennend`), läuft der Kandidat in select wie bisher. Die B1-Läufe des Vorlaufs sind die B1-Seite
     der Paare und werden nicht wiederholt.
  5. Ein `unklar`es Kernurteil ist weder erfüllt noch verfehlt: erst klären (Beleg nachreichen oder Prüfer), dann entscheiden; kein Kandidatenstart vorher.
  Evidenz: Über E3-Runde 1 und 2 zeigte kein Kandidat einen Vorteil, wo B1 den Kern in select schon erfüllte (3 von 3), und einer, wo B1 ihn verfehlte (1 von 1).
  Bei vier Kandidaten ist das ein Hinweis, kein Gesetz.
- **Test-Split verbraucht:** Nach einmaliger Nutzung kein zweiter Kandidat auf demselben test (SL1 §5.5, WEB-R4). Neue Runde = neue Familien.
- **Keine Rückkehr:** Aus `getestet` geht es nur nach `vorgelegt` oder `verworfen`; Nachbessern erzeugt einen neuen Kandidaten ab `vorgeschlagen`.
- **Manuelle Änderungen ohne Lauf** (wie SL2) sind keine übersprungene Messung, sondern direkte Owner-Vorlagen. Sie werden im PR als *ungemessen* gekennzeichnet; der Owner darf sie mergen.
- Optimierer-Adapter (APE-Bandit, GEPA) erzeugen nur `vorgeschlagen`; ihre interne Val-Auswahl ersetzt select, nie test (P4/P5).

## 5. Aktivierung und Rücknahme

**Vorgabe:** Aktivierung nur durch den Owner am Kandidaten-Hash; im Repo durch PR-Merge.

1. **Hashbindung:** Der PR enthält genau die Anwendung des Kandidaten auf die Baseline. Deterministisch geprüft: Paketsatz-Hash nach dem Merge
   = getesteter Kandidatenhash, und Baseline-Hash im Hauptzweig vor dem Merge = Kandidat-Baseline (Compare-and-swap, K6.4, SO-R4).
   Weicht eines ab, ist der Kandidat `veraltet`; getestete und aktive Version sind dann nicht dieselbe.
2. **Pfadgrenze:** Ein Aktivierungs-PR ändert nur Skill-Dateien der genannten Dimension, nie Rubrik, Fälle, Splits oder Judge-Konfiguration (§8).
3. **Abhängige Skills:** Der Bericht listet Skills und Abläufe, die über `requires` auf Artefakte des geänderten Skills angewiesen sind
   (SL3-Entwurf; bis zu dessen Implementierung nur per Textsuche, *Ableitung*). Ihre Fälle laufen als Regression mit. Laufende Runs behalten ihre fixierte Version (Plan §6).
4. **Beobachtung:** Fenster, Prüfsuite (Pflichtregression plus ausgewählte synthetische Fälle) und Abbruchsignal stehen vor dem Merge fest.
   Beobachtet wird nur auf zulässigen Daten (§3), nicht auf persönlichen Sessions.
5. **Rücknahme:** Revert des Aktivierungs-PR durch den Owner. Danach deterministisch prüfen: aktiver Hash = Vorgängerhash; abhängige Skills
   wieder auf ihrem vorherigen kompatiblen Stand; Bericht verweist auf beide Commits. Ein Kandidat, der auf dem zurückgenommenen Stand aufbaut, wird `veraltet`.
   Ein beobachteter R-Verstoß löst eine **vorgeschlagene** Rücknahme aus, keine autonome.

## 6. Budgets und E3-Plan

Vor jedem Lauf festzulegen und im Split-/Budgetmanifest zu versionieren: maximale Kandidaten je Runde, Iterationen, CLI-Starts,
Wiederholungen, Proposer- und Judge-Starts. Alle zählen im selben Startbudget (SL1 §9). Die Grenze rechtfertigt keinen kostenpflichtigen Start ohne Autorisierung.

**Stand:** 0 von ~40 Starts verbraucht. SL1 §9 verteilt alle 40 Starts auf den Diagnosepilot; **für E3 bleibt im Rahmen nichts übrig.**
Die Owner-Antwort sah ursprünglich ~14 Starts für E3 vor; diese Spannung ist offen.

**E3-Minimalplan** (Grenzen vorab, Kandidaten von Hand, keine Proposer- und Judge-Starts):

| Schritt | Inhalt | Starts |
|---|---|---|
| 0 | Baseline am dann aktuellen Stand neu einfrieren; K-DESC neu binden oder neuen Auswahlkandidaten aus E1-dev-Spuren formulieren | 0 |
| dev | E1-Auswahlläufe auf dev-Familien liefern das Feedback (keine Zusatzstarts) | 0 |
| select, B1-Vorlauf | 2 select-Familien × B1, Kernurteil absolut (§4, SLV0-EVAL-25) | 2 |
| select, Kandidat | nur bei `trennend`: höchstens 1 Kandidat, 1 Iteration, 2 select-Familien × Kandidat; B1-Seite aus dem Vorlauf | 2 |
| test | 4 neue, bisher ungesehene Familien × B1/Kandidat, gepaart, 1 Wiederholung | 8 |
| Regression | R-01, R-02, R-05 auf dem Kandidaten | 3 |
| Aktivierung/Rücknahme | im Testbestand (Scratch-Branch) durchspielen, deterministisch | 0 |
| Reserve | Abbruch | 1 |
| **Summe** | bei `nicht_trennend` endet die Runde nach dem Vorlauf mit 2 Starts | **16** |

Begründung: Eine Auswahldimension lässt sich aus der Spur deterministisch messen (M2), also ohne Judge-Kosten. Das setzt voraus, dass C0
Skill-Aufrufe beobachtbar macht; sonst ist E3 blockiert. Schwelle für `vorgelegt`, vor dem Test festzuschreiben: 0 R-Verstöße, kein positiver
Fall verloren, mindestens eine Familie besser und keine schlechter. Bei vier Familien ist das ein **Prozessnachweis**, kein belastbarer Lernnachweis (SL1 §7, F5).

**Ressourcenbedarf:** 16 zusätzliche Starts über die ~40 hinaus, **oder** eine Owner-Umschichtung innerhalb der 40
(z. B. M4-Baseline-Pilot 12 → 4, Reserve 4 → 0, E1-Verhalten 6 → 2). Dieses Dokument trifft keine der beiden Entscheidungen.

## 7. Grenzen von Modelltraining

- Kein Fine-Tuning in V1, E3 oder SL5. Needle/N0 bleibt ein eigener Hub-Versuch; hier höchstens späterer Router-Kandidat nach §2.4.
- Ein Router muss gegen Regeln und Basismodell auf demselben unabhängigen Test gewinnen; Export, Gerätebedarf und Betrieb zählen zum Aufwand.
- **Rückzug ≠ Faktkorrektur:** Einen Erinnerungseintrag zurückzuziehen wirkt sofort und deterministisch (A09). Was in Gewichte eingeflossen ist,
  lässt sich nicht gezielt entfernen; Rücknahme heißt dann: vorherige Gewichte wiederherstellen und ohne die Daten neu trainieren.
  Deshalb: Trainingsdaten je Gewichtsstand versioniert und hashgebunden, nur zulässige Daten (§3), Vorgängergewichte aufbewahrt.
- Eine neue Erinnerung, ein kürzerer Prompt oder ein niedrigerer Loss beweisen keinen besseren Skill (Plan §3, §7).

## 8. Bewertungsmaßstäbe

Kein Autor, Optimierer oder Skill ändert Rubrik, Fälle, Splits, Schwellen oder Judge-Konfiguration. Das ist deterministisch über eine
Pfadgrenze prüfbar (§5 Punkt 2). Rubrikänderungen kommen in einem eigenen PR mit neuer `rubrik_version`/`eval_version` und Begründung;
danach wird die Baseline auf der neuen Version neu gemessen. Vergleiche über Rubrikversionen hinweg sind ungültig.
Ein nach Testeinsicht geänderter Maßstab macht den Test zum Entwicklungsdatum (P2-Befund, WEB-R4). Die Judge-Version ist fixiert, mit menschlicher Stichprobe (SL1 §7).

## 9. Abnahme (Plan §8, SL4)

| Kriterium | Erfüllt durch | Stand |
|---|---|---|
| Inhalts-, Auswahl-, Kompositionsoptimierung beschrieben | §2.1–2.3 (plus Modellparameter §2.4) | spezifiziert; Komposition vorläufig bis SL3-Review |
| Datenwege | §3 inkl. A09-Abgrenzung | spezifiziert nach Owner-Vorgabe |
| Aktivierung und Rücknahme | §5, Zustände in §4 | spezifiziert; nicht durchgespielt |
| Kandidat verändert aktive Library nicht | Invariante L1, Zustand `veraltet`, Pfadgrenze §5.2 | spezifiziert; Baseline-Bindung im Helfer *im Code gefunden*; §1-Befund zeigt, dass manuelle Änderungen daneben laufen |
| Testsatz bleibt unabhängig | Rollen und Splitzugriff §4, „verbraucht“, keine Rückkehr, Val ≠ Test | spezifiziert; Zugriffstrennung nicht implementiert |
| Grenzen von Modelltraining klar | §2.4, §7 | spezifiziert |

Praktisch nachgewiesen ist davon nichts. Die Abnahme bestätigt nur Vollständigkeit des Vertrags, keinen Lernerfolg.

## 10. Deterministisch vs. Skill, offene Punkte

| Deterministisch (SL7, Kern) | Vorhanden? | Skill `evaluating-changes` |
|---|---|---|
| Baseline einfrieren, Paketsatz-Hash | ja, Pilot-Helfer `freeze`/`verify_snapshot` (Research, nicht Produkt) | Vergleichbarkeit beurteilen, zweite Variable benennen |
| Kandidat an Baseline binden, Dimensionsprüfung | teils, `variant_files` (zwei Dimensionen) | Hypothese gegen Ergebnis prüfen |
| Startzähler | teils, `record-start` lokal, max. 40, keine systemweite Sperre | – |
| Splitzugriff nach Rolle, „verbraucht“-Markierung | nein | Leck erkennen und melden |
| Bericht nur aus Rohdaten, Usage-Quellen | teils, `normalize` | Unsicherheit und Aufwand formulieren |
| Zustandsautomat, Compare-and-swap, Pfadgrenze, Revert-Prüfung | nein | Empfehlung mit Rücknahmepfad und abhängigen Skills |

**Offen:**
- SL3 nur als unreviewter Entwurf: §2.3 und §5.3 nach dessen Review abgleichen.
- Pilot-Baseline und K-DESC/K-PORTABLE sind veraltet (§1); vor E1/E3 neu einfrieren. K-PORTABLE ist durch SL2 praktisch ungemessen übernommen.
- E3-Budget: Zusatzfreigabe oder Umschichtung (§6) – Owner-Entscheidung, sinnvoll als Frage unter `docs/fragen/skill-library/`.
- Form und Ort des Feedback-Manifests und wer es bestätigt (Vorschlag: Owner im PR).
- C0 weiterhin blockiert (Anmelde-/Abrechnungsweg); ohne beobachtbare Skill-Aufrufe kein deterministisches M2 und kein E3.
- Unabhängige test-Familien müssen außerhalb der öffentlichen Pilotfälle entstehen; wer sie schreibt und verwahrt, ist offen.
- Optimierer-Adapter (Stufe 5) und Dependency-Wahl APE/GEPA/DSPy bleiben zurückgestellt, bis ein manueller Kandidat als Vergleichsbasis gemessen ist.
