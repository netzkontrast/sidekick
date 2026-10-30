# Dossier: prompt-architect

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/prompt-architect |
| Upstream (laut Doku) | https://github.com/ckelsoe/prompt-architect (npm `@ckelsoe/prompt-architect`, Autor Charles Kelsoe) |
| Commit-SHA | `6e12013eb782042595b99878d66ca46f68fc7885` |
| Letzter Commit | 2026-03-30 („Fix marketplace.json version …“, v3.2.2) |
| Lizenz | MIT, „Copyright (c) 2025 prompt-architect contributors“; Manifeste nennen Charles Kelsoe als Autor |
| Art | Skill · Prompt-Bibliothek · CLI (Installer) |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, lokale Skriptläufe) |

## Zweck

Ein einzelner Agent Skill, der vage Prompts analysiert, anhand der Nutzerabsicht ein Prompt-Framework
aus einem Katalog von 27 Frameworks wählt, gezielt nachfragt und einen kopierfertigen, überarbeiteten
Prompt ausgibt. Zielgruppe: Nutzer von Claude Code, Gemini CLI, Cursor, Copilot u. a. *(dokumentiert)*

## Kernkonzepte


| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Absicht vor Framework | Erst eine von sieben Absichtsklassen bestimmen (wiederherstellen, klären, erzeugen, umformen, schlussfolgern, kritisieren, agentisch), dann innerhalb der Klasse über Unterscheidungsfragen ein Framework wählen. | *dokumentiert* (Anweisung an das Modell) | [SKILL.md#L27](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L27) |
| Framework-Katalog als Progressive Disclosure | `SKILL.md` enthält nur Auswahltabellen; Details liegen in 27 Referenzdateien, Gerüste in 29 Template-Dateien und werden erst bei Bedarf geladen. | *im Code gefunden* (Dateistruktur) | [SKILL.md#L194](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L194) |
| Framework-spezifische Rückfragen | Je Framework ist festgelegt, welche Lücken (Rolle, Publikum, Schritte …) erfragt werden; 3–5 Fragen pro Runde. | *dokumentiert* | [SKILL.md#L123](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L123) |
| Feste Ausgabereihenfolge | Analyse → Nutzungshinweis → bereinigter Prompt als letzter Block, ohne Framework-Überschriften, kopierfertig. | *dokumentiert* | [SKILL.md#L164](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L164) |
| Negativkriterium | Explizite Liste, wann kein Framework angewendet werden soll (Prompt bereits vollständig, Faktenfrage, Eile). | *dokumentiert* | [SKILL.md#L268](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L268) |
| Kombinationen | Ein Hybrid-Template beschreibt Paarungen (z. B. Interview → Erzeugen, Umformen → Verfeinern). | *im Code gefunden* (Template) | [hybrid_template.txt#L1](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/assets/templates/hybrid_template.txt#L1) |
| Heuristische Framework-Empfehlung | Python-Skript ordnet Absichten per Substring-Schlüsselwörtern zu und punktet Kandidaten; ohne Treffer Rückfall auf „erzeugen“. | *im Code gefunden*, *praktisch nachgewiesen* | [framework_analyzer.py#L439](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/scripts/framework_analyzer.py#L439) |
| Heuristische Prompt-Bewertung | Fünf Dimensionen (Klarheit, Spezifität, Kontext, Vollständigkeit, Struktur) 0–10 über Wortlisten. | *im Code gefunden*, *praktisch nachgewiesen* | [prompt_evaluator.py#L5](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/scripts/prompt_evaluator.py#L5) |
| Client-Adapter | Agent-Skills-fähige Clients lesen `SKILL.md` direkt; nur Windsurf (`.windsurfrules`) und „beliebige API“ (Systemprompt-Datei) erhalten eigene Adapter. Frühere Cursor/Copilot/Codex-Adapter wurden in v3.0 entfernt. | *dokumentiert* | [adapters/README.md#L1](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/adapters/README.md#L1) |
| Multi-Client-Installer | Erkennt `~/.claude`, `~/.gemini`, `~/.agents` und kopiert den Skill-Ordner dorthin; Build erzeugt ein `.skill`-Zip. | *im Code gefunden* | [install.js#L24](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/scripts/install.js#L24), [build-skill.js#L1](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/scripts/build-skill.js#L1) |
| Strukturvalidierung | Prüft Frontmatter (`name` Kleinbuchstaben/Bindestriche ≤ 64, `description` ≤ 1024), Pflichtdateien, Versionsgleichheit `package.json`/`plugin.json`. | *im Code gefunden*, *praktisch nachgewiesen* | [validate-skill.js#L173](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/scripts/validate-skill.js#L173) |

## Artefakte und Formate

- `SKILL.md` mit YAML-Frontmatter: `name`, `description` (Auslöse-Phrasen eingebettet), `license`,
  `compatibility`, `metadata.{author,version,homepage}` *(im Code gefunden)*.
- `references/frameworks/*.md` (27), `assets/templates/*_template.txt` (29), `scripts/*.py` (2).
- Claude-Plugin-Manifeste `.claude-plugin/plugin.json` und `marketplace.json`; `package.json` trägt
  zusätzlich einen `claudeCode`-Block mit Absichtsklassen und Frameworkliste (28 Einträge, weil RISE-IE/IX getrennt).
- CI-Workflow führt `npm test`, `npm run validate` und `npm pack --dry-run` auf Node 18/20/22 aus *(dokumentiert, nicht ausgeführt)*.

## Messung und Evaluation

- **Praktisch nachgewiesen** (2026-10-30, Node v22.22.0, ohne `npm install`): `node scripts/validate-skill.js`
  endet mit Exit 0, 0 Warnungen; `node scripts/test.js` meldet 18/18 bestanden. Geprüft wird nur Struktur und Metadaten, nicht Prompt-Qualität.
- **Praktisch nachgewiesen** (Python 3.13, `python3 -I`): Der Demo-Lauf von `framework_analyzer.py`
  klassifiziert „Rewrite this email …“ als *create* (CO-STAR), „Recover the prompt from this output“ als
  *create* mit Konfidenz 0 und „Argue against our decision …“ als *transform* (BAB). Die Schlüsselwort-Heuristik
  widerspricht damit der eigenen Auswahltabelle in `SKILL.md` in mindestens drei von zwölf Demo-Fällen.
- `prompt_evaluator.py` liefert Wortlisten-Scores (z. B. 4,4 für „Write about AI“). Die README nennt dies
  „Quality Scoring System“; `SKILL.md` verweist gar nicht auf die Skripte, das Modell bewertet also frei *(im Code gefunden)*.
- „Research-backed“: Nur 13 von 27 Framework-Referenzen enthalten einen Abschnitt zur Forschungsbasis
  (z. B. Self-Refine mit arXiv-Verweis); Akronym-Frameworks wie CO-STAR, RISEN, CARE haben keinen *(im Code gefunden)*.
  Eine Wirkungsmessung des Skills selbst fehlt *(offen)*.

## Grenzen und Risiken

- `postinstall` ruft den Installer auf; nicht-interaktiv installiert er nach `~/.claude/skills/prompt-architect`
  und löscht dort vorher rekursiv ein vorhandenes Verzeichnis ([install.js#L136](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/scripts/install.js#L136),
  [install.js#L432](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/scripts/install.js#L432), [package.json#L76](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/package.json#L76)) *(im Code gefunden)*. Nebenwirkung beim reinen `npm install`.
- Frontmatter-Prüfung per Regex statt YAML-Parser; mehrzeilige `description` würde nur in der ersten Zeile gemessen *(im Code gefunden)*.
- Validator-Listen (Pflicht-Frameworks/-Templates) sind hartkodiert und müssen bei jeder Katalogänderung mitgepflegt werden.
- Ausgabe-Vorgaben (letzter Block, keine Überschriften) sind reine Modellanweisungen, nicht erzwungen.

## Clean-Room-Relevanz

- **Anforderung R1:** Technik-Katalog als Daten (ID, Absichtsklasse, Bestandteile, Rückfragen, Quellenangabe, Evidenzgrad) statt Freitext; Laden nach Progressive Disclosure.
- **Anforderung R2:** Auswahl in zwei Stufen (Absicht → Unterscheidungsmerkmal → Technik), mit expliziter „keine Technik nötig“-Option und Kombinationsregeln.
- **Anforderung R3:** Skill-Validator, der Frontmatter echt parst (Name, Länge, Pflichtfelder), Referenzen auf Dateien prüft und Katalog/Manifeste konsistent hält – Liste aus den Daten ableiten, nicht hartkodieren.
- **Anforderung R4:** Ein kanonisches Skill-Format, aus dem Adapter (Systemprompt, Windsurf-Regeln, Zip-Paket) generiert werden.
- **Anforderung R5:** Installation ohne implizite Seiteneffekte (kein `postinstall`-Schreiben ins Home-Verzeichnis, kein stilles Löschen).
- Nicht übernommen: Schlüsselwort-Heuristiken als „Analyse“ (nachweislich ungenau); Framework-Texte und Templates (nur Konzepte).
- Kategorie: **Verhalten neu implementieren**; Katalog-Inhalte bei Bedarf lizenziert übernehmen (MIT, Eintrag im Herkunftsregister nötig).

## Offene Punkte

- A/B-Vergleich mit gleichem Prompt-Set: mit Skill vs. ohne, bewertet durch festes Rubrik-Set (erfordert API-Aufrufe, nicht ausgeführt).
- Prüfen, ob `.skill`-Zip tatsächlich von ChatGPT/Gemini CLI akzeptiert wird (Build nicht ausgeführt, benötigt `zip`).
- Quellenlage der Akronym-Frameworks (CO-STAR, RISEN …) unabhängig klären, bevor sie im Katalog als „forschungsbasiert“ gelten.
