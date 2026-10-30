# SL-A03 – Bereich planning-work-packages

## 1. Kopf

ID: **SL-A03** · Skill `planning-work-packages`.

> Stand 30.10.2026 · SL2-Bereichsbefund zum [Library-Research-Plan](library-research-plan.md) §4 · **Entwurf zur Review**, kein Skill geändert.
> Gelesene Stände: Sidekick-Branch `research/learnable-skill-library` bei `bc602964` (Skill, `skill-evaluation.json` ST-03/ST-04/ST-09, [Hub-PLAN](../agent-hub/operations/PLAN.md)), V0-Spec-Entwurf `origin/spec/v0-ziel-und-vertraege` bei `2c4733e0` (PR #8, offen; `auftrag.schema.json`, V0-ABL-01), Fremd-Repos zu den SHAs aus der [README](README.md#untersuchte-repositories).
> Evidenz wie in `AGENTS.md`: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*. Kein Modell- oder CLI-Lauf, kein Fremdcode ausgeführt.

## 2. Nutzerfall

Ein Ziel (Phase, Meilenstein, Research-Spike, Skill-Änderung) soll in kleine, unabhängig prüfbare Pakete zerlegt werden, die an das bestehende Backlog anschließen.
In Sidekick sind das zwei Formen: Pakete eines Research-/Entwicklungsplans (z. B. SL0–SL7) und später Aufträge im Hub mit Vertrag (`V0-AUF`, Entwurf).
Der Skill plant, er führt nicht aus und startet keine Agents.

## 3. Trigger / Nicht-Trigger

- **Trigger:** „Plane den nächsten Meilenstein in Paketen“ (ST-03), „break this into tasks“ (ST-04), Implementierungsplan, Research-Spike zuschneiden.
- **Nicht-Trigger:** schon vollständiger Plan, der nur ausgeführt werden soll (ST-09), triviale Einzelschritte, **offene Präferenzen des Nutzers** (→ `grilling`), Entscheidungsreife prüfen (→ `reviewing-decision-gates`), Faktenfragen zu Fremd-Repos (→ `researching-repositories`).

## 4. Eingabe / Ausgabe

| Richtung | Artefakt | Nächster Skill |
|---|---|---|
| Eingabe | Ziel, Arbeitsregeln, bestehendes Backlog/Statusquelle, beantwortete Fragen (A01), Befunde mit Evidenz (A02), Entscheidungen | – |
| Ausgabe | Pakete mit ID, Ergebnis, Eingaben (Verweis auf Vorgänger-Ausgabe), Artefakt, Abnahme → Nachweis, Blockaden, nächster Schritt | `reviewing-decision-gates` (Freigabe einer Phase), Ausführung durch Mensch/Hub |
| Ausgabe | Research-Spikes mit Frage, begrenztem Versuch, Abbruchbedingung | `researching-repositories` |
| Ausgabe | Offene Präferenzfragen als Abhängigkeit | `grilling` |

Übergaberegel für C-01 (SL1 §5.3): Ein Paket mit Abnahme, aber ohne benannten Nachweis gilt als fehlerhafte Übergabe.

## 5. Voraussetzungen und erlaubte Weitergabe

- Lesezugriff auf Ziel und Statusquelle. Der Plan schreibt Status nur dort, wo das Projekt ihn führt (hier: Hub-PLAN bzw. Library-Research-Plan); keine zweite Statusquelle (`package.md`, *dokumentiert*).
- Ein Plan ist keine Freigabe: weder Umsetzung, Veröffentlichung noch Budget entstehen daraus (Skill-Schlusssatz). Befugnis je Auftrag vergibt der Hub-Kern (V0-INV-01).
- Paketfelder zu Befugnis und Datenklasse beschreiben **benötigte** Rechte; sie erteilen keine.

## 6. Antworten auf die Forschungsfragen (Plan §4)

**F1 – Kleine durchgängige Pakete statt Featurelisten.** Skill Schritt 3 verlangt Schnitt nach prüfbaren Ergebnissen und den „kleinsten durchgängigen Nutzungsablauf“ zuerst (*dokumentiert*). Was fehlt, ist eine prüfbare Abgrenzung. Vorschlag: Ein Paket ist zulässig, wenn es ein beobachtbares Ergebnis mit Nachweis hat und ein späteres Paket es als Eingabe verwenden kann. Eine Liste „Feature X bauen“ ohne Nachweis oder ohne Verbraucher wird in Ablaufscheiben umgeschnitten. Gut belegtes Gegenstück im Repo: V0-ABL-01 ist eine solche Scheibe (zwölf Schritte, eigene Abnahme, *dokumentiert* im Entwurf). Ob Modelle das umsetzen, ist *offen* (Fall PW-01).

**F2 – Notwendige Felder.** Heute in `package.md`: Ziel/Nicht-Ziele, Eingaben/Abhängigkeiten, Artefakt, Abnahme → Nachweis, Blockaden, nächster Schritt; Fehlerfälle und Rücknahme nur „bei Bedarf“ (*dokumentiert*). Der V0-Auftrag verlangt `ziel`, `abnahmekriterien`, `befugnis`, `budget`, `datenklasse`, optional `ausgangsstand` und `herkunft` (Schema-`required`, *im Code gefunden* im Entwurf). Keine Spalte für Zustandseigentum oder Wiederaufnahme.
Vorschlag: Pflichtfelder bleiben schlank. **Bedingte Felder**, sobald ein Paket Zustand, Daten, Effekte oder Unterbrechungen berührt:
- *Zustandseigentum*: wer schreibt welchen Zustand, wo ist die maßgebliche Quelle (Verweis, keine Kopie);
- *Datenweg und Datenklasse*: woher Eingaben kommen, wohin Ausgaben gehen, ob etwas das Gerät verlässt (V0-INV-09);
- *Befugnis*: welche Rechte oder Freigaben benötigt werden und wer sie erteilt;
- *Wiederaufnahme*: welcher Zwischenstand bei Abbruch gesichert sein muss und ob eine Wiederholung idempotent ist (V0-INV-06);
- *Abnahme*: wer abnimmt; nie der Bearbeiter selbst (V0-AUF-06).
Die Namen folgen dem V0-Schema, damit Planpakete später ohne Übersetzung zu Aufträgen werden. Ob die Zusatzfelder Ergebnisse verbessern oder nur Text kosten, muss M4 zeigen (*offen*).

**Kompositionsfrage:** „Eingaben“ sollen auf benannte Ausgaben von Vorgängern verweisen. Fehlt der Erzeuger, ist das eine sichtbare Lücke, kein stilles Weiterplanen (Lehre aus claude-prompts-mcp, §7).

## 7. Beiträge der Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| claude-prompts-mcp | Ketten mit Ein-/Ausgabe-Mapping je Schritt; zwei mitgelieferte Ketten ergeben beim Parsen still 0 Schritte; Server liefert nur Anweisungstext für die Abfolge | [index.ts#L613](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/index.ts#L613), [loader.ts#L321](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/loader.ts#L321); Dossier (*praktisch nachgewiesen* dort) | **Anforderung**: jede Paketeingabe verweist auf eine benannte Ausgabe; fehlender Erzeuger wird gemeldet (K3.3) |
| recursive-decomposition-skill | Fehlermodi bei Zerlegung: Doppelverarbeitung (Segmente verfolgen), Kontextverlust in Teilaufträgen (minimalen Kontext mitgeben), Widersprüche in der Synthese (Prüfdurchgang) | [rlm-strategies.md#L161-L177](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L161-L177), *dokumentiert* | **Anforderung**: Pakete sind selbsttragend (Eingaben genannt) und überschneidungsfrei; Schwellen **zurückstellen** |
| agentic-harness-patterns-skill | Hintergrundaufgaben mit typisierten IDs und Zustandsmaschine mit endgültigen Endzuständen; Delegation mit selbsttragenden Aufträgen | Dossier [agentic-harness-patterns-skill](repos/agentic-harness-patterns-skill.md), *dokumentiert*; Herkunft ungeklärt | Nur als eigene **Anforderung**, getragen von V0-AUF-Zuständen; Text und Interna **zurückstellen** |
| skills-optimizer | Explizite fail-closed Endzustände; Iterationslimit pro Datei (nur Prompt-Regel) | Dossier [skills-optimizer](repos/skills-optimizer.md), *dokumentiert* | **Anforderung** für Spikes: „kein Ergebnis/blockiert“ ist ein gültiger Ausgang; Limit vorab im Paket |
| prompt-engineering-skill (eigenes Material) | Mit minimal lauffähiger Fassung beginnen, dann iterieren | [SKILL.md#L222](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L222), *dokumentiert* | Bestätigt Schritt 3; keine Änderung |
| prompt-architect | Hybrid-Paarungen (z. B. Interview → Erzeugen) als Vorlage | Dossier [prompt-architect](repos/prompt-architect.md), *im Code gefunden* | Kompositionsbeispiel für SL3, für A03 **zurückstellen** |

code2prompt trägt zu A03 nichts bei.

## 8. Grenzen

- Ob die bedingten Felder Planqualität verbessern, ist ohne gepaarten Vergleich (M4, B1 gegen Kandidat) *offen*; sie könnten Pläne nur länger machen.
- Das V0-Schema ist ein offener Entwurf. Feldnamen erst nach dessen Review festschreiben.
- Ein Plan kann Zustandseigentum benennen, aber nicht erzwingen; Durchsetzung bleibt Hub-Kern (Journal, Claims).

## 9. Minimalversuch

Zwei synthetische Zerlegungen, explizit geladen (M3), im SL5-Rahmen nach C0; nicht ausgeführt:
- **PW-02 Skill-Auftrag:** „Mache den Grilling-Skill projektneutral“ mit Eingabe [SL-A01 §11](area-grilling.md#11-konkreter-änderungsvorschlag) und dem Library-Research-Plan als Statusquelle. Erwartung: 2–4 Pakete (Text, Fälle, deterministische Prüfung GT-L1, Review), Status nur im Plan verlinkt, keine Umsetzung.
- **PW-03 Hub-Auftrag:** V0-ABL-01 Schritte 4–7 (Rückfrage, Verbindungsabbruch, Antwort von anderem Gerät). Erwartung: Pakete mit bedingten Feldern Zustandseigentum (Kern schreibt Journal), Wiederaufnahme (Cursor-Nachlieferung), Befugnis (nur Owner antwortet), Nachweis je Abnahme als Contract-Test-ID.
- **Erfolg:** alle Assertions einzeln berichtet; jedes Paket hat Ergebnis und Nachweis; keine neue Statusdatei; keine erfundenen Pfade oder Testbefehle (ST-04).
- **Abbruch:** Modell beginnt umzusetzen oder legt eine Status-/Backlogdatei an → Verstoß gegen Skill-Grenze, für diesen Fall „fehlgeschlagen“, Reihe läuft weiter.
Deterministisch prüfbar ohne Modell: Pflichtfelder je Paket per Muster (später Validator, *offen*).

## 10. Entscheidung

**ändern**, und zwar klein: zwei Regeln in SKILL.md, bedingte Felder in `package.md`, neue Fälle. Kein neuer Skill. Die Feldprüfung (vorhanden/leer) ist **deterministisch lösbar**; ob der Inhalt trägt, bleibt Rubrik (M3/M4).

## 11. Konkreter Änderungsvorschlag

**SKILL.md**
- Schritt 1: ergänzen „Status nur in der vorhandenen Statusquelle führen; der Plan verlinkt sie.“ (bisher nur in `package.md`, wird so auch ohne Öffnen der Referenz wirksam).
- Schritt 3: ergänzen „Ein Paket braucht ein beobachtbares Ergebnis, das ein späteres Paket oder die Abnahme nutzt; Featurelisten in durchgängige Scheiben umschneiden.“
- Schritt 4: ergänzen „Eingaben verweisen auf benannte Ausgaben früherer Pakete oder vorhandene Artefakte; fehlt der Erzeuger, als Lücke markieren.“
- Schritt 5: „Ergänze bei riskanten Änderungen Fehlerfälle, Rücknahme und betroffene Schnittstellen“ → „Berührt ein Paket Zustand, Daten, Rechte oder Unterbrechungen, ergänze Zustandseigentum, Datenweg/Datenklasse, benötigte Befugnis, Wiederaufnahmepunkt sowie Fehlerfälle und Rücknahme.“
- Research-Spike (Schlussabsatz bzw. `package.md`): „kein Ergebnis“ ausdrücklich als gültigen Ausgang nennen.

**references/package.md**
- Block „Nur bei Bedarf“ → „Bei Zustand, Daten, Rechten oder Unterbrechung: Zustandseigentum (maßgebliche Quelle), Datenweg/Datenklasse, benötigte Befugnis und wer sie erteilt, Wiederaufnahmepunkt/Idempotenz, Abnehmer. Sonst bei Bedarf: Aufwandsspanne, Schnittstellen, Fehlerfälle, Rücknahme.“
- Zeile „Eingaben und Abhängigkeiten“ → „Eingaben (Paket-ID.Ausgabe oder Artefakt) und Abhängigkeiten“.

**Beschreibung (neu, 437 Zeichen, mit Python nachgezählt):**
„Zerlege Ziele oder Anforderungen in kleine, ausführbare und überprüfbare Arbeitspakete mit Abnahme und Nachweis. Nutze diesen Skill für Projektplanung, nächste Phasen, Implementierungspläne oder Research-Spikes; englisch „break this into tasks“, „plan the next milestone“, „work breakdown“. Nicht für triviale Einzelschritte, bereits klar geplante Ausführung, offene Präferenzfragen an den Nutzer oder die Prüfung von Entscheidungsreife.“

**Evaluationsfälle** (Vorschlag für `skill-evaluation.json`; Präfix PW bis zur Übernahme als fortlaufende ST-IDs)

| ID | Ebene | Prompt / Eingabe | Erwartung |
|---|---|---|---|
| PW-01 | M3 | Eingabe ist eine Featureliste (Login, Suche, Export) | Umschnitt in eine durchgängige erste Scheibe; jedes Paket mit Nachweis |
| PW-02 | M3 | Skill-Auftrag wie §9 | Status nur verlinkt; keine Umsetzung |
| PW-03 | M3 | Hub-Auftrag wie §9 | bedingte Felder vorhanden und konsistent mit V0-Zuständen |
| PW-04 | M3 | Spike „Parser A oder B?“ ohne Testumgebung | Frage, begrenzter Versuch, Abbruchbedingung; „kein Ergebnis“ zulässig |
| PW-05 | M2 | „Plane das, aber ich weiß noch nicht, was mir wichtiger ist.“ | Konkurrenzfall: zulässige Menge `{grilling, planning-work-packages}`; gleiche `family_id` wie GT-10 |
| PW-06a / PW-06b | M2 | DE „Zerlege das Ziel in Arbeitspakete.“ / EN „Give me a work breakdown for this goal.“ | eine `family_id`, beide → planning-work-packages |
| PW-07 | M2 | „Was ist der nächste Schritt?“ bei vorhandenem Plan mit offenem Punkt | Grenzfall: kein neuer Plan, Verweis auf vorhandenen Punkt (Familie ST-09) |
| PW-08 | M5 | Paket-Eingabe verweist auf eine nicht existierende Ausgabe | Lücke gemeldet statt weitergeplant (passt zu C-04) |
