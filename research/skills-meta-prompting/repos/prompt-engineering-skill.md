# Dossier: prompt-engineering-skill

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/prompt-engineering-skill |
| Upstream (laut Doku) | nicht angegeben; Commit-Autor `kongyo2` (Vermutung: github.com/kongyo2/prompt-engineering-skill, *offen*) |
| Commit-SHA | `eec9ca5c9c99c9baaa1e5104374139771224fd3f` |
| Letzter Commit | 2025-10-17 (Commit-Message „99“; insgesamt 2 Commits) |
| Lizenz | **keine** – weder LICENSE-Datei noch README noch `license`-Feld im Frontmatter; auch keine Copyright-Zeile |
| Art | Skill · Prompt-Bibliothek |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumentenlektüre) |

## Zweck

Reiner Markdown-Skill (6 Dateien, ~2 500 Zeilen), der ein Modell anleitet, Prompts im Dialog zu entwerfen,
zu optimieren und zu prüfen. Kein Code, keine Skripte, kein README *(im Code gefunden: Dateiliste)*.

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Einstiegs-Weiche | Drei Einstiege je nach Anfrage: vager Wunsch → Exploration; vorhandener Prompt → minimale Optimierung; konkretes Fehlverhalten → fokussierte Analyse. | *dokumentiert* | [SKILL.md#L12](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L12) |
| Vier-Phasen-Ablauf | Exploration (Bedarf, Nutzer, Häufigkeit, Erfolg, technische Grenzen) → Analyse (Aufgabe klassifizieren, Strategie wählen, Alternativen mit Trade-offs zeigen) → iterative Umsetzung (Minimalversion, dann Klarheit, dann Optimierung) → Validierung. | *dokumentiert* | [SKILL.md#L26](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L26) |
| Aufgabenklassifikation → Technik | Vier Achsen (Komplexität, Ausgabetyp, Fehlertoleranz, Häufigkeit) steuern die Technikwahl; zusätzlich eine Matrix Aufgabentyp → primäre/sekundäre Technik → zu vermeiden. | *dokumentiert* | [SKILL.md#L56](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L56), [techniques.md#L280](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/techniques.md#L280) |
| Minimal-Edit-Optimierung | Bei bestehenden Prompts nur Ursache beheben, Funktionierendes bewahren, danach Regression prüfen. | *dokumentiert* | [SKILL.md#L126](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L126) |
| Versionierte Prompt-Artefakte | Prompts als Markdown mit Versionshistorie, Designentscheidungen, bekannten Grenzen und Beispielen ablegen. | *dokumentiert* | [SKILL.md#L101](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L101) |
| Technik-Katalog | Grundlagen (klare Anweisung, Kontext, Rolle, Format), fortgeschritten (Chain-of-Thought, Few-Shot, Selbstprüfung, Metakognition), speziell (Constitutional, Tree of Thoughts, Prompt-Chaining, Negativbeispiele). | *dokumentiert* | [techniques.md#L1](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/techniques.md#L1) |
| Anti-Pattern-Katalog | Zehn benannte Fehlmuster (u. a. widersprüchliche Vorgaben, „Kitchen Sink“, Scheinpräzision bei Skalen) plus Warnsignale und Mindest-Testfälle. | *dokumentiert* | [antipatterns.md#L3](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/antipatterns.md#L3) |
| Gewichtete Qualitätsrubrik | Sieben Dimensionen (Klarheit, Vollständigkeit, Konsistenz, Effizienz, Robustheit, Wartbarkeit, Wirksamkeit), Skala 1–5, Gewichte je Einsatzprofil (Hochrisiko, kreativ, Produktion). | *dokumentiert* | [evaluation.md#L3](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/evaluation.md#L3), [evaluation.md#L171](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/evaluation.md#L171) |
| Muster-Bibliothek | Wiederverwendbare Prompt-Gerüste nach Zweck (Analyse, Erstellung, Review, Problemlösung, Transformation, Extraktion, Validierung, Interaktion). | *dokumentiert* | [patterns.md#L1](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/patterns.md#L1) |
| Vorher/Nachher-Beispiele | Sechs Fallbeispiele zur Verbesserung vager Prompts. | *dokumentiert* | [examples.md#L1](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/examples.md#L1) |

## Artefakte und Formate

- `prompt-engineering/SKILL.md` mit minimalem Frontmatter: nur `name` und `description` (Auslöser im Fließtext) *(im Code gefunden)*.
- Fünf Referenzdateien unter `references/`, aus `SKILL.md` per Dateiname verlinkt (Progressive Disclosure).
- Keine Templates, Skripte, Manifeste, Adapter oder Tests. Einige Überschriften in `evaluation.md` sind
  zweisprachig (Englisch/Japanisch) – Hinweis auf Herkunft, nicht belegt.

## Messung und Evaluation

- Das Repo misst nichts selbst; die Rubrik ist eine Anleitung zur manuellen bzw. modellgestützten Bewertung *(dokumentiert)*.
- Innere Inkonsistenz: `SKILL.md` nennt fünf Prüfdimensionen, `antipatterns.md` fünf Scores ohne Skala,
  `evaluation.md` sieben Dimensionen mit 1–5-Skala *(im Code gefunden)*.
- „Industry Baselines“ und Reifegrade in `evaluation.md` sind ohne Quellenangabe [evaluation.md#L324](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/evaluation.md#L324) *(dokumentiert, unbelegt)*.
- Kein Test, ob der Skill bessere Prompts erzeugt als ein Basismodell *(offen)*.

## Grenzen und Risiken

- **Lizenz fehlt:** Ohne Lizenz bestehen keine Nutzungsrechte an Text oder Struktur. Nur Ideen und allgemein
  bekannte Techniken dürfen in eigenen Worten aufgegriffen werden; keine Passagen, Tabellen oder Beispiele übernehmen.
- Herkunft unklar (kein README, kein Upstream-Hinweis, Commit-Message ohne Aussage).
- Viele Techniken sind Allgemeingut (Chain-of-Thought, Few-Shot, Tree of Thoughts); Quellen werden nicht zitiert.
- Rein instruktiver Skill: Ablauf und Validierung hängen vollständig von der Befolgung durch das Modell ab.

## Clean-Room-Relevanz

- **Anforderung R1:** Modus-Weiche am Einstieg (neu erstellen / minimal optimieren / Fehler diagnostizieren) mit jeweils eigenem, kurzem Ablauf.
- **Anforderung R2:** Klassifikation der Aufgabe auf wenigen Achsen (Komplexität, Ausgabetyp, Fehlertoleranz, Wiederverwendung) als Eingabe der Technikwahl – kompatibel mit der Absichtsklassifikation aus [prompt-architect](prompt-architect.md).
- **Anforderung R3:** Eine einzige, versionierte Qualitätsrubrik mit einsatzabhängigen Gewichten und Testfall-Set (Normalfall, Randfall, Fehlfall); keine konkurrierenden Rubriken.
- **Anforderung R4:** Anti-Pattern-Prüfliste als maschinenlesbare Regeln (z. B. Widerspruch, fehlendes Erfolgskriterium, Überladung), soweit automatisierbar.
- **Anforderung R5:** Prompt-Artefakte mit Versionshistorie, Begründung und bekannten Grenzen ablegen.
- Nicht übernommen: sämtliche Texte, Muster, Beispiele (keine Lizenz).
- Kategorie: **Verhalten neu implementieren** (nur Konzepte); Übernahme von Inhalten **zurückstellen**, bis eine Lizenz vorliegt.

## Offene Punkte

- Upstream-Repo und Lizenzstatus beim Autor klären (Issue oder Anfrage); bis dahin Clean-Room strikt.
- Rubrik gegen die Bewertung aus prompt-architect abgleichen und eine eigene, belegte Rubrik spezifizieren.
- Wirkungstest (Skill vs. ohne Skill) mit festem Prompt-Set – benötigt API-Aufrufe, nicht ausgeführt.
