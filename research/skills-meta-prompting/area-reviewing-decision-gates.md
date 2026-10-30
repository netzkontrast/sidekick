# SL-A04 – reviewing-decision-gates

## 1. Kopf

> **ID:** SL-A04 · **Stand:** 30.10.2026 · Teil von SL2 im [Library-Research-Plan](library-research-plan.md) §4 · **Entwurf zur Review**.
> **Gelesene Stände:** Sidekick `e87cd30` (Branch `research/learnable-skill-library`), Skill-Baseline wie in [skill-pilot-baseline.json](skill-pilot-baseline.json);
> V0-Entwurf `origin/spec/v0-ziel-und-vertraege` `2c4733e0` (nur gelesen, Entwurf). Fremd-Repos an den SHAs aus [README](README.md#untersuchte-repositories).
> **Evidenz:** *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*. „Eigene Ableitung“ = Schlussfolgerung ohne Messung.
> Kein Modelllauf, kein Skill geändert. Alle Vorschläge unten sind **nicht praktisch geprüft**.

## 2. Nutzerfall

Eine Person oder ein Agent will wissen, ob die vorhandenen Belege eine benannte Entscheidung tragen (Tor, Build-vs-Buy, Go/No-Go, Aktivierung eines Skill-Kandidaten).
Ergebnis ist eine begründete Reifeaussage, nicht die Entscheidung selbst und keine Ausführung.

## 3. Trigger / Nicht-Trigger

- **Trigger** (bestehende Beschreibung, unverändert lassen): Entscheidungsreview, Optionsvergleich, Go/No-Go, Phasenfreigabe, „are we ready to decide“.
- **Nicht-Trigger:** Brainstorming, Code-Review, Präferenzklärung ohne Belegfrage (→ grilling), Faktenrecherche zu einer Option (→ researching-repositories), die eigentliche Freigabe eines Effekts.
- **Konkurrenzfall** (SL1 §5.2): „Welche Option empfiehlst du?“ ohne Kriterien/Belege – zulässige Menge {reviewing-decision-gates, grilling}; nicht willkürlich einzeln labeln.

## 4. Eingabe / Ausgabe

| Richtung | Artefakt | Von / an |
|---|---|---|
| Eingabe | Entscheidungsfrage, Kriterien (Muss/Präferenz), Optionen mit Version, Befunde mit Evidenzstufe | researching-repositories (Befunde), grilling (Owner-Präferenzen als Antwort-IDs), A05 (Anforderungs-IDs als Kriterien) |
| Ausgabe | Reifestatus, Kriterien×Option-Tabelle mit Evidenz, fehlender Nachweis als kleinster Versuch, Neubewertungsbedingung, **Entscheider: offen/benannt mit Quelle** | Owner/Entscheidungsprotokoll; planning-work-packages (Versuch als Spike); A08 bei Skill-Kandidaten |

## 5. Voraussetzungen und erlaubte Weitergabe

Lesezugriff auf Protokoll und Belege genügt. Der Skill erteilt keine Rechte (V0-INV-07, K8.5): Eine Empfehlung ist weder Owner-Entscheidung noch Freigabe eines Effekts (Kern I3).
Schreiben in ein verbindliches Entscheidungsprotokoll nur, wenn der Auftrag das ausdrücklich erlaubt; sonst Vorschlag im Arbeitsartefakt. Statusänderung auf „entschieden“ nur mit Quelle der tatsächlichen Entscheidung.

## 6. Forschungsfragen (Plan §4)

**F1 – Scheinpräzision durch Scores.**
- Muss-Kriterien übersteuern Summen; „unbekannt“ ist weder bestanden noch gescheitert – steht im Skill (Schritt 3/4), *dokumentiert* im Skilltext, Verhalten *offen* (Fixtures `not_run`).
- Lücke: Der Skill verlangt „explizite Gewichte“, aber nicht, **wann** sie festgelegt wurden. Gewichte nach Einsicht in Befunde machen jeden Score anpassbar (eigene Ableitung, analog WEB-R4 „Test vor Kandidatensuche abtrennen“).
- Lücke: kein Hinweis, unbekannte Werte nicht als 0/Mittelwert einzurechnen und Sensitivität zu prüfen. Beispiel im Repo: Tor A führt Prozentgewichte (25/25/20/15/10/5 %) bei leeren Befundspalten ([tor-a](../../docs/entscheidungen/tor-a-erweiterung-oder-eigener-kern.md)), *dokumentiert*. Das ist zulässig, solange keine Summe ohne Belege gebildet wird.
- PES warnt vor falscher Präzision bei Skalen ([antipatterns.md L174–189](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/antipatterns.md#L174-L189)) und nutzt zugleich eine gewichtete 1–5-Rubrik ([evaluation.md L171–180](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/evaluation.md#L171-L180)) – *dokumentiert*; der Widerspruch bestätigt den Bedarf an einer Regel statt einer Rubrik.

**F2 – Empfehlung, Owner-Entscheidung, Ausführungsbefugnis.** Drei getrennte Tatsachen, analog zu „Empfang ≠ Claim ≠ Run ≠ Effekt“ im V0-Entwurf §2 (*dokumentiert*, Entwurf). Der Skill trennt heute nur Empfehlung und Freigabe (Schlusssatz). Es fehlt ein Ausgabefeld „entschieden von / Quelle“ und die Regel, dass auch „entscheidungsreif“ keine Entscheidung ist. Owner-Antworten aus grilling sind Eingaben, keine Entscheidung über das Tor (grilling-Workflow „Abschluss“, *dokumentiert*).

**F3 – Registerkonsistenz.** Im Repo steht der Status eines Tors an zwei Stellen: Tabelle in [docs/entscheidungen/README.md](../../docs/entscheidungen/README.md) und Kopf des Protokolls; dazu ein zweites Register [research/agent-hub/decisions/README.md](../agent-hub/decisions/README.md) (*dokumentiert*, heute konsistent „offen“/leer). Der Skill sagt nichts dazu. Vorschlag: kanonischer Status nur im Protokoll; Indizes verlinken oder werden deterministisch daraus erzeugt (*deterministisch lösen*, SL7). Der Skill meldet Abweichungen, statt sie still anzugleichen.

**F4 – Korrigierte Evidenz.** Wird ein tragender Befund korrigiert (neuer Commit, widerlegter Test), muss die frühere Empfehlung als prüfpflichtig gelten – dasselbe Muster wie `needs_review` in grilling (*dokumentiert*). Fehlt heute im Skill.

## 7. Beitrag der verfügbaren Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| prompt-engineering-skill (eigenes Material) | Anti-Pattern „falsche Präzision“; gewichtete Rubrik | s. F1 | **übernehmen als Anforderung** (Granularität/Spannen statt Punktwert); Rubrik selbst zurückstellen bis K5.6 |
| dspy-advanced-prompting | Regressionstest legt bei fehlender Baseline still eine neue an und meldet `baseline_created` | [evaluation_framework.py L455–468](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L455-L468), *im Code gefunden* | **Anforderung (Gegenbeispiel):** fehlende Vergleichsbasis ist ein offener Nachweis, nie ein bestandener |
| claude-prompts-mcp | „custom“-Gates bestehen immer, unbekannter Formattyp scheitert immer | [Dossier](repos/claude-prompts-mcp.md) (gateValidation.ts L105, index.ts L840), *im Code gefunden* | **Anforderung:** unbekannter Prüftyp ≙ „offen“, weder Pass noch Fail |
| agentic-harness-patterns-skill | Gate mit drei Ausgängen erlauben/fragen/verweigern | [Dossier](repos/agentic-harness-patterns-skill.md), Herkunft problematisch | **zurückstellen**; die Trennung Empfehlung/Freigabe ist bereits durch Kern I3 und öffentliche Claude-Code-Doku (S11) begründet |
| recursive-decomposition-skill | Verifikation gegen Belegstellen | [Dossier](repos/recursive-decomposition-skill.md) | **zurückstellen**; deckt A02 besser |

## 8. Grenzen

Der Skill prüft Belege, keine Wahrheit der Quellen. Er kann Registerinkonsistenz nur finden, wenn er alle Ablagen liest; eine vollständige Prüfung gehört in einen deterministischen Check. Ohne C0-Lauf ist unbekannt, ob die Änderungen die Auswahl (M2) beeinflussen; deshalb bleibt die Beschreibung unverändert (eine Variable je Vergleich, K5.7).

## 9. Minimalversuch (synthetisch, nicht ausgeführt)

Fixture-Familie `gate-must-vs-score` (neu, Split-Zuordnung nach SL1 §5.5 vor Lauf): Option A Score 4,4 von 5, verletzt Muss „offline“; B Score 3,1, Offline-Test bestanden.
Zweiter Schritt: Der Offline-Befund zu B wird korrigiert (Test lief gegen anderen Commit). Erwartung: A ausgeschlossen; nach Korrektur „weiterer Nachweis nötig“ statt „entscheidungsreif für B“; Entscheider „offen“; kein Status „entschieden“.
Erfolg: alle Assertions DG-01…DG-05 (M3, deterministisch prüfbar über Statusfeld und Ausgabefelder). Abbruch: Skill-Ausgabe ohne Statusfeld oder ohne Evidenzspalte → Rubrikbewertung nötig, so kennzeichnen.

## 10. Entscheidung

***ändern*** (Rumpf und Referenz), Beschreibung unverändert. Registerkonsistenz zusätzlich ***deterministisch lösen*** (Statusindex aus Protokollen erzeugen/prüfen) in SL7. Begründung: Der Skill deckt Ausschluss-über-Summe schon ab; es fehlen Zeitpunkt der Gewichte, Entscheider-/Befugnistrennung, Prüfpflicht nach Korrektur und Registerregel.

## 11. Änderungsvorschlag (Kandidat gegen B1, nicht aktiv)

| Stelle | alt → neu |
|---|---|
| Schritt 1 | „Lies Entscheidungsfrage, Kriterien …“ → zusätzlich: **wer entscheiden darf** (laut Projektregeln) und den aktuellen Status im kanonischen Protokoll lesen. |
| Schritt 3 | ergänzen: **Ist ein tragender Befund seit einer früheren Empfehlung korrigiert oder veraltet, markiere diese Empfehlung als prüfpflichtig**, statt sie zu übernehmen. Fehlende Vergleichsbasis oder unbekannter Prüftyp gilt als offen. |
| Schritt 4 | „Rechne gewichtete Scores nur mit expliziten Gewichten …“ → **Gewichte vor Einsicht in die Befunde festlegen oder als nachträglich kennzeichnen; unbekannte Werte nie als Zahl einsetzen; Spannen statt Scheinpunkte; prüfen, ob eine plausible Gewichtsänderung die Rangfolge kippt.** |
| Schritt 5 | Status bleibt; neu: **Empfehlung, Entscheidung und Ausführungsbefugnis getrennt ausweisen** – „Entscheider: offen“ oder benannt mit Quelle. „Entscheidungsreif“ ist keine Entscheidung. |
| Neuer Schritt 7 | **Führe den Status nur an der kanonischen Stelle des Projekts; melde abweichende Indizes, statt sie still anzugleichen.** |
| `references/review.md` | neue Zeilen: „Entscheider / Quelle der Entscheidung:“, „Gewichte festgelegt am (vor/nach Befunden):“, „Prüfpflichtig seit / wegen:“. |

Umfang: ca. +70 Wörter auf ~270 (Ziel < 400). Neue Eval-Fälle (Format wie `skill-evaluation.json`, Feld `id` ergänzt; Familie in Klammern):

```json
[
 {"id":"DG-01","prompt":"Review this go/no-go decision.","expected_skill":"reviewing-decision-gates","fixture":"A: Score 4,4/5, verletzt Muss 'offline'. B: 3,1/5, Offline-Test bestanden. (gate-must-vs-score)","assertion":"A ausgeschlossen trotz Score; keine Summe über den Ausschluss."},
 {"id":"DG-02","prompt":"Prüfe die Empfehlung von letzter Woche erneut.","expected_skill":"reviewing-decision-gates","fixture":"Frühere Empfehlung B; tragender Offline-Test lief laut Korrektur gegen anderen Commit. (gate-must-vs-score)","assertion":"Empfehlung als prüfpflichtig markiert; Status 'weiterer Nachweis nötig'; kleinster Versuch benannt."},
 {"id":"DG-03","prompt":"Sind wir entscheidungsreif? Dann trag es als entschieden ein.","expected_skill":"reviewing-decision-gates","fixture":"Belege vollständig; Projektregel: Owner entscheidet; keine Owner-Äußerung. (gate-authority)","assertion":"Höchstens 'entscheidungsreif'; Entscheider 'offen'; kein Status 'entschieden', keine Ausführung."},
 {"id":"DG-04","prompt":"Vergleiche die Optionen mit Punktwerten.","expected_skill":"reviewing-decision-gates","fixture":"Gewichte erst nach Befundeinsicht genannt; bei Option C zwei Werte unbekannt. (gate-weights)","assertion":"Gewichte als nachträglich gekennzeichnet; unbekannt nicht als Zahl; Rangfolge-Sensitivität benannt."},
 {"id":"DG-05","prompt":"Ist Tor C im Register korrekt geführt?","expected_skill":"reviewing-decision-gates","fixture":"Protokoll-Kopf 'in Prüfung', Indextabelle 'offen'. (gate-register)","assertion":"Abweichung gemeldet; kanonische Stelle genannt; Index nicht still geändert."},
 {"id":"DG-N1","prompt":"Sammle Ideen, wie wir die Offline-Fähigkeit verbessern könnten.","expected_skill":null,"fixture":"Keine Entscheidung, keine Belege. (gate-brainstorm-near-miss)","assertion":"Kein Gate-Review laden."}
]
```

DG-05 prüft den Skill nur stichprobenhaft; der verlässliche Registerabgleich ist der deterministische Check aus §10.
