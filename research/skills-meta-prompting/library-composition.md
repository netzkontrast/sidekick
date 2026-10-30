# SL3 – Kompositionsvertrag der Skill-Library

> Stand 30.10.2026 · Ergebnis von SL3 im [Library-Research-Plan](library-research-plan.md) (§6, §8) · **Entwurf zur Review**.
> Evidenz wie in `AGENTS.md`: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*; *Vorschlag* = eigene Anforderung ohne Messung.
> Es wurde kein Modell-, CLI- oder Testlauf ausgeführt, kein Skill geändert und nichts installiert. Keine Aussage hier ist gemessen.

## 1. Zweck, Stand, gelesene Stände

Dieser Vertrag legt fest, wie die acht Skills unter `.agents/skills/` ausdrücklich und versioniert zusammenarbeiten: Datenmodell, Schichten, Übergabeartefakte, Auflösung, Fehler, Kontext, Rechte und Offline. Er ist Eingabe für SL4 (Lernvertrag) und SL7 (Implementierungsübergabe), keine Laufzeitspec.

| Quelle | Gelesener Stand |
|---|---|
| Dieser Branch `research/learnable-skill-library` | `1c36e725` (acht Skills, neun `area-*.md`, SL0/SL1, Synthese, Pilot-Artefakte) |
| V0-Spec, nur Entwurf (PR #8) | `origin/spec/v0-ziel-und-vertraege` `2c4733e0` (V0-INV-01…11, V0-FALL-01…17, V0-ABL-01) |
| Fremd-Repos über Dossiers | claude-prompts-mcp (CPM) `7e1fb3f0`, recursive-decomposition-skill (RD) `1780d46a`, dspy-advanced-prompting (DSPY) `facc1ad8`, skills-optimizer (SO) `f8082b57` |

Fremdquellen gehen nur als Anforderungen oder Gegenbeispiele ein; kein Code, kein Prompttext übernommen. V0-Begriffe (Auftrag, Journal, Freigabe, Epoch, Datenklasse) werden verwendet, aber nicht neu definiert; bis zum Merge von PR #8 sind sie Vorschläge.

## 2. Datenmodell: Skill-Paket

Grundsatz (*Vorschlag*, gestützt auf Plan §6 „Paketvertrag“): Das portable Paket bleibt ein normaler Agent-Skills-Ordner. Alles, was die Spezifikation nicht vorsieht, liegt als **Registry-Datensatz** daneben und verweist per Hash auf das Paket. So ändert ein Registry-Eintrag nie den Paket-Hash.

| Feld | Ort | Inhalt / Regel |
|---|---|---|
| `name` | SKILL.md Frontmatter | Kebab-Case, gleich Ordnername (lokal geprüft in SL0 §2.2) |
| `description` mit Triggern und Nicht-Triggern | SKILL.md Frontmatter | Einzige Auswahlgrundlage, die der Client sieht (*dokumentiert*, SL0 §2.2) |
| Rumpf, Referenzen | SKILL.md, `references/` | Verhalten; Referenzen nur bei Bedarf geladen |
| Client-Adapter | `agents/openai.yaml` | Laut K1.1 künftig generiert, nicht gepflegt |
| `skill_id` | Registry | Stabil, nie umbenannt; anfangs gleich `name` |
| `version` | Registry | Lesbares Label; Identität ist der Hash. Gleiche Version mit anderem Hash ist ein Fehler (SL3-R03) |
| `content_hash` | Registry | SHA-256 über alle Dateien des Skill-Ordners, kanonisch sortiert (wie SL1 §8); Kanonisierung offen (O-1) |
| `inputs` / `outputs` | Registry | Artefakttypen mit Typversion (§4); `required` oder `optional` |
| `requires_capabilities` | Registry | z. B. AskUser (optional, Chat-Fallback), Lesezugriff Repo, Schreibzugriff Ablage |
| `effects_requested` | Registry | Beantragte Wirkungen (etwa „schreibt Fragenablage“); **Anforderung, kein Recht** (§8) |
| `relations` | Registry | `requires` / `alternative` / `recommends` (§3) |
| `provenance` | Registry | Herkunft, Autor, Commit, Lizenz/Notices, Verweis auf Herkunftsregister |
| `test_refs` | Registry | Fall-IDs (GT/ST/B/C/R, Bereichsfälle) samt `family_id` und Split nach SL1 §5 |
| `status` | Registry | `candidate` / `approved` / `withdrawn`; Aktivierung nur durch Owner am Hash (Owner-Antwort Aktivierung, SL0 §5) |

**Projektkonfiguration** (Ablageorte, ID-Schemata, Statusquelle) steht weder im Paket noch im Registry-Datensatz, sondern in den Projektregeln (`AGENTS.md`). Das setzt die Projektneutralität aus SL-A01 fort.

## 3. Schichten und Beziehungen

| Schicht | Inhalt | Beispiel | Versioniert als |
|---|---|---|---|
| **L1 Basisfertigkeit** | Ein Skill, eine Fähigkeit, eigene Ein-/Ausgabetypen | die acht Skills | Paket + Hash |
| **L2 Ablauf** | Deklarierte Folge von L1-Schritten mit Übergabetypen, Abbruch- und Wiederaufnahmepunkten; **Daten, kein Code und kein Skill-Text** (Kern §6) | Kette C-01/E2 | eigener Hash; pinnt alle L1-Hashes |
| **L3 Projektkonfiguration** | Ablagen, ID-Schemata, Statusquelle, Sprache, erlaubte Datenklassen | `AGENTS.md` dieses Repos | Commit |

Beziehungen (Plan §6: „Abhängigkeit, Alternative und optionale Empfehlung sind unterschiedliche Beziehungen“):

- **`requires`**: Ein Schritt braucht ein Artefakt eines Typs. Erfüllt durch einen Erzeuger im Ablauf **oder** ein vorhandenes, gültiges Artefakt. Fehlt beides, wird der Ablauf vor dem Start abgelehnt (SL3-R05).
- **`alternative`**: Zwei Skills bedienen dieselbe Absicht; genau einer wird gewählt, mit Begründung im Run-Manifest. Beispiel: „Welche Option empfiehlst du?“ → {reviewing-decision-gates, grilling} (SL-A04 §3, SL1 §5.2).
- **`recommends`**: Unverbindlicher Folgeschritt. Er wird als Vorschlag angezeigt und **nie** automatisch ausgeführt (SL3-R08).

Ein L1-Skill ruft keinen anderen Skill auf. Komposition existiert nur in L2 oder durch ausdrückliche Steuerung von Mensch oder Hub (Plan §1).

## 4. Übergabeartefakte zwischen den acht Skills

Jedes Artefakt trägt Kopf-Pflichtfelder: `artifact_id`, `type@version`, Erzeuger (`skill_id` + Hash), Run-ID, Eingabe-Referenzen mit Hash, Datenklasse, Zeitpunkt. Typ-Pflichtfelder sind **deterministisch** prüfbar (vorhanden/leer/Format); ob der Inhalt trägt, bleibt Rubrik (M3/M4). Die Typ-Pflichtfelder sind aus den Übergaberegeln der Bereichsbefunde abgeleitet.

| Erzeuger | Artefakttyp | Typ-Pflichtfelder (Auszug) | Verbraucher | Quelle |
|---|---|---|---|---|
| grilling | `answer-set` (beantwortete Fragen) | Frage-ID + Version, Antwort-ID, Quelle; nur `answered` und nicht `needs_review` | specifying, planning, reviewing | SL-A01 §4 |
| grilling | `open-questions` | IDs, Grund, blockierte Arbeit | planning (Abhängigkeit), researching (Faktblockade) | SL-A01 §4 |
| researching-repositories | `finding` (Befund mit Evidenz) | Aussage, Quelle mit Rolle, gelesener Commit, Fundstelle, **Evidenzstufe**, Lizenz je Bestandteil, Empfehlungskategorie | reviewing, planning, specifying | SL-A02 §4 |
| specifying-behavior | `spec-entry` | Anforderungs-IDs, Zustände, Fallliste ID → Fall, vorläufige IDs | planning, testing, reviewing | SL-A05 §4 |
| planning-work-packages | `work-package` / `spike` | Paket-ID, Ergebnis, Eingaben als Verweis auf Vorgänger-Artefakt, Abnahme → **Nachweis**, Blockaden | reviewing, Ausführung durch Mensch/Hub, researching (Spike) | SL-A03 §4 |
| reviewing-decision-gates | `gate-review` (Reifestatus) | Status ∈ {entscheidungsreif, weiterer Nachweis nötig, nicht tragfähig}, Kriterium × Option mit Evidenz, kleinster Versuch, **Entscheider: offen/benannt** | Owner/Protokoll, planning, evaluating | SL-A04 §4 |
| resuming-work | `handoff` (Übergabe) | Auftragsbezug + Version, Ausgangscommit, Artefakt-Hashes, unklare Wirkungen, genau ein nächster Schritt | resuming-work (Fortsetzen) | SL-A06 §4 |
| resuming-work | `context-package` | je Aussage bestätigt/veraltet/unbekannt, prüfpflichtige Folgeartefakte | Skill des nächsten Schritts | SL-A06 §4 |
| testing-system-boundaries | `failure-matrix` (Testmatrix) | Fall-ID → Spec-ID, Störung, Injektionspunkt, Soll je Zustellung/Lauf/Wirkung, Umgebung, Rohbelegort, Status | planning, reviewing, evaluating | SL-A07 §3 |
| evaluating-changes | `comparison-report` (Vergleichsbericht) | Baseline-/Kandidatenhash, Ebene M0–M5/R, Zähler/Nenner, Familien, Aufwand mit Quelle, Empfehlung, Rücknahmeplan | reviewing, Owner (Aktivierung), A09 | SL-A08 §3 |
| *(A09, kein Skill)* | `memory-candidate` | Quelle mit Fundstelle, Geltung, Zustand `candidate`, Trainingsfreigabe `false` | Owner; danach Kontextpakete | SL-A09 §3 |

Regel: Übergaben laufen **per Referenz mit Hash**, nicht als Kopie (SL-A05 §5 gegen Doppelpflege). Ein Verbraucher prüft vor Arbeitsbeginn Typ, Typversion und Pflichtfelder seiner `required`-Eingaben.

## 5. Auflösung und Versionen

- **SL3-R01** Beim Start eines Ablaufs entsteht ein **Run-Manifest**: je Schritt `skill_id`, Version, Hash, Referenz-Hashes, erwartete Typversionen, Ablauf-Hash, Projektregel-Commit, Client und Modell soweit gemeldet (K5.7, WEB-R1). Es wird im Journal bzw. bis dahin neben den Rohdaten gespeichert.
- **SL3-R02** Ein laufender Run wechselt nie still auf eine neue Skill-, Referenz- oder Ablaufversion. Neue freigegebene Versionen erscheinen als „verfügbar“; ein Wechsel ist ein ausdrücklicher Schritt mit neuem Manifest.
- **SL3-R03** Vor dem Start prüft der Resolver Hash gegen Registry: abweichender Hash bei gleicher Version, `withdrawn`- oder `candidate`-Status im produktiven Ablauf → sichtbare Ablehnung mit Grund.
- **SL3-R04** Typkompatibilität: Der Erzeuger-Ausgabetyp muss die `required`-Eingabe des Verbrauchers in derselben Major-Typversion erfüllen. Sonst Ablehnung vor dem Start, nicht erst beim Schritt.
- **SL3-R05** Fehlt eine Pflichteingabe oder eine `required`-Capability (z. B. Schreibzugriff), wird abgelehnt. Optionale Capabilities nutzen den im Skill dokumentierten Fallback und werden so markiert (grilling: AskUser → Chat, Schritt 5).
- Fortsetzen nach Unterbrechung nutzt das gespeicherte Manifest; resuming-work vergleicht Artefakt-Hashes. Haben sich Eingaben geändert, werden abhängige Ergebnisse prüfpflichtig (SL-A06; C-02).

## 6. Fehlerverträge

Solange keine geprüfte Laufzeitspec existiert, steuert **Mensch oder Hub** jede Kette ausdrücklich; es gibt keine impliziten Kaskaden (Plan §1, SL1 §5.3). Gegenbeispiel aus CPM: fehlende Eingabe im Kettenschritt nur als Warnung, Schritt läuft weiter ([prompt-executor.ts L218–229](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/prompt-executor.ts#L218-L229), *im Code gefunden*); Kettenstand nur im Prozessspeicher ([types/index.ts L86–92](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/types/index.ts#L86-L92), *im Code gefunden*).

| ID | Fehler | Erkennung | Reaktion | Ergebnis-Zustand |
|---|---|---|---|---|
| SL3-F01 | **Zyklus** im Ablauf | statisch beim Laden des L2-Ablaufs (Graph der `requires`-Kanten) | Ablauf wird nicht gestartet; Zyklus mit Knoten benannt. Wiederholung nur als neuer, ausdrücklich angestoßener Schritt | `rejected_definition` |
| SL3-F02 | **Fehlende/falsche Ausgabe** | Typ- und Pflichtfeldprüfung an der Übergabe | Übergabe abgelehnt; Verbraucher startet nicht; Rückfrage oder Wiederholung des Erzeugers nur ausdrücklich | `handoff_rejected` |
| SL3-F03 | **Inkompatible Version** | Resolver vor dem Start (R03/R04) | sichtbare Ablehnung mit benötigter und vorhandener Version | `rejected_resolution` |
| SL3-F04 | **Teilfehler** | Schritt liefert nur einen Teil (z. B. 2 von 3 Befunden ohne Evidenzstufe) | gültige Teile mit `partial` weitergeben; abhängige Schritte für die ungültigen Teile blockiert | `partial` |
| SL3-F05 | **Abbruch/Unterbrechung** | Owner-Abbruch, Session-Ende, Runtime tot | Übergabe nach resuming-work; begonnene Wirkungen als unklar; keine automatische Wiederholung (V0-FALL-07/-08) | `paused` / `cancelled` |
| SL3-F06 | **Rekursionstiefe** | Harness-Zähler | Skill→Skill-Tiefe 0 (verboten); Delegationstiefe Standard 1, mehr nur konfiguriert und gemessen (Synthese „Widersprüche“, K4.4, K8.2) | `rejected_depth` |
| SL3-F07 | **Fehlende Capability** | Resolver bzw. beim Start nachgewiesen | wie V0-FALL-17: Ablehnung oder `exited_error`; Capability gilt nur als `behauptet` | `rejected_capability` |

Kein Fehlerzustand zählt als Erfolg; ein unklarer Ausgang bleibt unklar (V0-INV-03). DSPY zeigt Planer mit Abhängigkeiten und Tiefenlimit (*im Code gefunden*, Dossier C5); das ist Bestätigung der Anforderung, keine Vorlage.

## 7. Kontext und Budget

- **SL3-R06** Drei Ladestufen: Katalog (nur `name` + `description`), Rumpf bei Auswahl, Referenzen bei Bedarf (K1.3, Synthese „Progressive Disclosure“). Übergabeartefakte gehen als Referenz plus kurze Zusammenfassung, nicht als Volltext.
- **SL3-R07** Reicht das Kontextbudget nicht, wird gemeldet und gefragt; kritische Regeln (Rechte, Antwortregeln, Pflichtfelder) werden nie still gekürzt (K7.3).
- Größen werden heute in Bytes/Wörtern geführt (SL0 §2.1). **Tokenangaben erst mit benanntem Tokenizer** (K7.1); Schätzungen gekennzeichnet, fehlende Werte „unbekannt“ (K7.6). Ob Komposition gegenüber Einzelskills Kontext spart oder kostet, ist *offen*.

## 8. Rechte und Laufzeit

- **SL3-R08** Skills **empfehlen**, der Harness **erzwingt**: Befugnis aus dem Auftrag (V0-INV-01), Datenklasse, Budget und Effekt-Tore (V0-INV-04). `effects_requested` ist ein Antrag; der Harness gleicht ihn mit den Grants ab und lehnt Überschüsse ab.
- Kein Artefakt (Antwort, Reifestatus, Spec, Vergleichsbericht, Übergabe) erteilt Rechte oder Freigaben (V0-INV-07, K8.5). „entscheidungsreif“ ist keine Entscheidung; „zur Aktivierung vorlegen“ ist keine Aktivierung.
- Fremdinhalte (READMEs, Übergaben, Modellausgaben) sind Daten, keine Anweisungen (R-02, V0-FALL-16).
- Jedes Artefakt erbt die strengste Datenklasse seiner Eingaben; `local-only`-Artefakte verlassen das Gerät nicht, auch nicht als Übergabe an einen anderen Schritt auf einem anderen Gerät (V0-INV-09).
- Budgetgrenzen gelten für den gesamten Ablauf, nicht je Schritt allein; Kosten je akzeptiertem Ergebnis (K7.7).

## 9. Offline und Synchronisation

- **SL3-R09** Jedes Gerät hält eine gepinnte, freigegebene Library (Registry-Auszug + Pakete mit Hash). Offline läuft ein Ablauf nur mit lokal vorhandenen, freigegebenen Hashes; fehlt einer, wird abgelehnt (SL3-F03), kein Nachladen „irgendeiner“ Version.
- **SL3-R10** Synchronisation bringt neue Freigaben als „verfügbar“, ändert laufende Runs nicht (R02). Zwei freigegebene Fassungen derselben `skill_id` mit verschiedenem Hash und gleichem Versionslabel sind ein sichtbarer `conflict`; der Owner wählt (analog V0-FALL-13). Innerhalb eines Runs werden nie Versionen gemischt.
- Kandidaten werden nie als aktive Version synchronisiert; Rückzug (`withdrawn`) wirkt auf neue Runs, laufende Runs zeigen eine Warnung.

## 10. Beispielablauf und Ablehnungsfälle

Angelehnt an C-01/C-02 (SL1 §5.3) und E2 (Plan §9): synthetischer Rechercheauftrag „Eignet sich Bibliothek X für Wiederaufnahme?“ mit einer offenen Präferenz. Datenklasse `internal`. Alle IDs synthetisch. **Ablauf ist ein Entwurf, nicht ausgeführt.**

| # | Wer steuert | Schritt | Eingabe | Ausgabe-Artefakt | Prüfung an der Übergabe |
|---|---|---|---|---|---|
| 0 | Mensch/Hub | Ablauf `E2@1` laden, Run-Manifest fixieren | Auftrag, Registry | Manifest mit 6 Hashes | Zyklusfrei, Typen kompatibel, Capabilities vorhanden (R01–R05) |
| 1 | Mensch startet | grilling | Auftrag | `answer-set` Q-1 (Präferenz „lokal vor Cloud“), `open-questions` Q-2 | Nur `answered` weiter; Q-2 als Abhängigkeit |
| 2 | Mensch startet | researching-repositories | Q-1, Prüffrage | `finding` F-1, F-2 mit Evidenzstufe, Commit, Fundstelle | Evidenzstufe je Befund vorhanden |
| — | — | **Unterbrechung**; Dossier zu X wird zwischenzeitlich geändert (Hash neu) | — | resuming-work: `handoff` H-1 | Ausgangscommit, Hashes, ein nächster Schritt |
| 3 | neue Session, Mensch | resuming-work (Fortsetzen) | H-1, aktueller Stand | `context-package`: F-2 *veraltet*, F-1 *bestätigt* | Prüfpflichtige Folgeartefakte benannt |
| 4 | Mensch startet | researching-repositories (nur F-2) | Kontextpaket | `finding` F-2′ | wie Schritt 2 |
| 5 | Mensch startet | specifying-behavior | Q-1, F-1, F-2′ | `spec-entry` S-01…S-03, Fälle S-C1…S-C3 | jede ID hat einen Fall |
| 6 | Mensch startet | planning-work-packages | S-IDs, Q-2 offen | `work-package` P-1 (Abnahme → Nachweis), `spike` SP-1 für Q-2 | Eingaben verweisen auf vorhandene Artefakte |
| 7 | Mensch startet | reviewing-decision-gates | F-1, F-2′, P-1, Q-1 | `gate-review`: „weiterer Nachweis nötig“, Entscheider: Owner | Statusfeld, Evidenzspalte, Entscheider vorhanden |
| 8 | Owner | Entscheidung bleibt offen; kein Effekt ausgelöst | — | Journal-/Rohdatensatz des Runs | Keine Freigabe aus Artefakten abgeleitet |

Erwartetes Endergebnis: lückenlose Artefaktkette mit Hashes, F-2 nachweislich ersetzt, kein Schritt ohne ausdrücklichen Start, kein still gewechselter Skill.

**Ablehnung A – Zyklus.** Ablaufdefinition `E2@2` lässt das `gate-review` „weiterer Nachweis nötig“ automatisch zu planning und von dort wieder zu reviewing laufen. Erwartet: SL3-F01 beim Laden, Ablauf startet nicht, Meldung nennt die Kante reviewing → planning → reviewing. Zulässig ist nur ein vom Menschen angestoßener neuer Schritt mit eigenem Manifest.

**Ablehnung B – falsche Ausgabe (C-04).** In Schritt 2 fehlt bei F-2 die Evidenzstufe. Erwartet: SL3-F02 an der Übergabe zu Schritt 5; F-1 geht als `partial` weiter (SL3-F04), Spec-Anforderungen auf F-2 bleiben blockiert; Rückfrage an den Menschen, ob researching für F-2 wiederholt wird. Kein Weiterarbeiten mit Warnung.

**Ablehnung C – inkompatible Version.** Registry enthält inzwischen planning-work-packages mit `inputs: spec-entry@2 (required: fallliste_hash)`, das Run-Manifest pinnt specifying-behavior mit Ausgabe `spec-entry@1`. Erwartet: Wird der Wechsel ausdrücklich angefordert, lehnt der Resolver mit SL3-F03 ab und nennt `spec-entry@1` vorhanden, `@2` benötigt. Ohne Anforderung läuft der Run mit den gepinnten Versionen weiter (R02) und zeigt die neue Version nur als verfügbar.

## 11. Rückverfolgung

| Anforderung | Inhalt kurz | Herkunft |
|---|---|---|
| §2 Paket/Registry getrennt | portables SKILL.md, Laufzeitdaten daneben | K1.1, K1.2, RD-R5, Plan §6 |
| §2 `content_hash`, `status` | Identität per Hash, Aktivierung am Hash | K6.2, K6.6, WEB-R9, SO-R4 |
| §2 `test_refs` | Fälle mit Familie und Split | K1.5, K5.1, WEB-R2, WEB-R4, SL1 §5 |
| §3 Schichten L1–L3 | Ablauf als Daten, Projektkonfig außerhalb | K3.3, CPM-R3, Kern §6, SL-A01 |
| §4 Artefakttypen | typisierte Ein-/Ausgaben, Pflichtfelder | K2.4, DSPY-C1, RD-R3, SL2 A01–A09 |
| R01–R03 | Run-Manifest, kein stiller Wechsel | K5.7, WEB-R1, K3.5 |
| R04/R05, F03, F07 | Typ- und Capability-Prüfung vor Start | K3.1, K3.3, V0-FALL-17 |
| F01–F06 | Fehlerverträge, Tiefe | K3.4, K4.4, K8.2, RD-R2, DSPY-C5, V0-INV-03 |
| F02/F04 | keine stille Fortsetzung | CPM (Gegenbeispiel), SL1 C-04, SL-A02/A03 Übergaberegeln |
| R06/R07 | Ladestufen, Budget, keine stille Kürzung | K1.3, K7.1, K7.3, K7.6 |
| R08, §8 | Skills empfehlen, Harness erzwingt | K8.1, K8.5, WEB-R8, V0-INV-01/-04/-07/-09 |
| R09/R10 | Offline-Pinning, sichtbare Konflikte | Plan §6 „Offline“, V0-FALL-13 |
| §10 Beispiel | E2/C-01/C-02/C-04 | SL1 §5.3, Plan §9, SL-A06 |
| Herkunft je Paket | Lizenz/Notices | WEB-R10, Clean-Room-Regeln `AGENTS.md` |

Nicht abgedeckt, weil Lernschleife: K5.4, K5.8, K6.1, K6.3–K6.5 → SL4. K2.1–K2.3, K2.5, K2.6 (Technik-Katalog) bleiben außerhalb dieses Vertrags.

## 12. Deterministisch versus Skill-Text; offene Punkte

**Deterministischer Code (Kandidaten für SL7):** Hashberechnung und Registry-Abgleich; Run-Manifest erzeugen und gegenprüfen; Zyklus- und Typprüfung eines L2-Ablaufs; Pflichtfeldprüfung an Übergaben; Tiefenzähler; Capability-Abgleich; Datenklassen-Vererbung; Offline-Pinning und Konflikterkennung; Diff/Hash-Vergleich beim Fortsetzen (SL-A06). Keine dieser Prüfungen braucht ein Modell.

**Skill-Text:** inhaltliche Qualität der Artefakte (Fragen, Befunde, Spec, Pakete, Urteile), Wahl zwischen Alternativen mit Begründung, Rückfragen bei abgelehnter Übergabe. Skills nennen ihre Ausgabefelder; sie prüfen keine fremden Versionen und rufen keine anderen Skills auf.

| ID | Offener Punkt | Nächster Schritt |
|---|---|---|
| O-1 | Kanonisierung des Hashes: Pfadsortierung, Zeilenenden, ob generierte Adapter (`agents/openai.yaml`) zählen | in SL7 festlegen; mit Pilot-Hashes aus `skill-pilot-baseline.json` abgleichen |
| O-2 | Registry-Format und Ort (eine Datei je Skill oder Library-Manifest); ob optionale Frontmatter-Felder der Agent-Skills-Spezifikation genutzt werden | gegen Spezifikation und Clientverhalten prüfen; neue Dateien erst nach Review |
| O-3 | Typversionierung der Artefakte (Schemaformat nach PR-#8-Konvention) | nach Review/Merge von PR #8 |
| O-4 | Ob ein L2-Ablauf als eigenes Artefakt nötig ist oder ein Auftrag mit Schritten genügt (Kern: „Playbooks sind Daten“) | an Tor A/B und V0-AUF koppeln |
| O-5 | Kontextkosten der Komposition gegenüber Einzelschritten | E2 in SL5 (C-03); nur mit Tokenizer und Rohdaten |
| O-6 | Kein praktischer Nachweis: Übergaberegeln sind in keinem Clientlauf geprüft; C0 ist blockiert | SL5 nach Klärung des Auth-/Abrechnungswegs |
| O-7 | A09 hat keinen Skill; `memory-candidate` ist bis zur V0-ERI-Review nur Typ-Entwurf | SL4 |

Nächster Schritt: Review dieses Entwurfs zusammen mit SL2; danach SL4 (Lernvertrag) auf Basis von §2 `status` und §5.
