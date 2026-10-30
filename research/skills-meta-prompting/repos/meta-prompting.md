# Dossier: meta-prompting

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/meta-prompting |
| Upstream (laut Doku) | Offizielles Repo zum Paper „Meta Prompting for AI Systems“, Zhang & Yao, [arXiv:2311.11482](https://arxiv.org/abs/2311.11482), ICLR 2024 BGPT Workshop ([README L9](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L9)); Upstream-Org laut Badge `meta-prompting.github.io` |
| Commit-SHA | `dc406edd3855b378c1bb8604ca00397e01ea2513` |
| Letzter Commit | 2026-08-02 („Update README.md“) |
| Lizenz | MIT, „Copyright (c) 2025 Yifan Zhang“; Mathe-Pipeline nach eigenem Hinweis aus fremden Quellen abgeleitet (siehe Risiken) |
| Art | Prompt-Bibliothek + Forschungscode (Inferenz/Evaluation für MATH/GSM8K) |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, ein lokaler Offline-Prüflauf) |

## Zweck

Belegmaterial zu einem Paper, das „Meta Prompting“ als beispielfreie, strukturelle Prompt-Schablone
definiert: Statt gelöster Beispiele bekommt das Modell ein Gerüst, *wie* eine Aufgabenkategorie zu
bearbeiten ist. Enthält wenige Prompt-Dateien, eine vLLM/OpenAI-Inferenzpipeline für Mathe-Benchmarks
und ein Game-of-24-Protokoll (*dokumentiert*, [README L11](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L11)).

**Abgrenzung:** Das Conductor-/Experten-Muster („Meta-Prompting“ von Suzgun & Kalai, arXiv:2401.12954)
ist *nicht* Gegenstand dieses Repos; eine Suche nach Experten-/Conductor-Logik blieb ohne Treffer
(*im Code gefunden*: nur eine Einzel-Persona im System-Prompt,
[inference.py L161–175](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/infer/inference.py#L161-L175)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Strukturelle Lösungs-Schablone | Ein Prompt beschreibt nur Ablauf und Ausgabeform (Problem-Slot, Schrittfolge, markierte Endantwort), keine Beispiele. Zwei Varianten: Markdown-Liste und JSON-Gerüst. | *im Code gefunden* | [prompts/mp/math.md L1–9](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/prompts/mp/math.md#L1-L9), [mp-json/gsm8k.md L1–12](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/prompts/mp-json/gsm8k.md#L1-L12) |
| Prompt-Typ als Auswahlparameter | Die Pipeline wählt die Schablone per `prompt_type` aus einer Ordnerkonvention und hängt die Aufgabe in einem typabhängigen Anschluss an (bei JSON: offenes Objekt, das das Modell fortsetzt). | *im Code gefunden* | [utils.py L39–48](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/utils/utils.py#L39-L48), [utils.py L57–72](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/utils/utils.py#L57-L72) |
| Meta-Prompts für Prompts | Drei Aufgaben-Schablonen, deren Eingabe selbst ein Prompt oder Dokument ist: Prompt aus Dokument entwerfen (ICPD, auch auf sich selbst anwendbar), Prompt auf Denktiefe umschreiben (PT-reasoning), Prompt kürzen (PT-concise). Ausgabe soll dasselbe Format haben wie die Eingabe-Schablone. | *im Code gefunden* | [mp-icpd-v0.1.md L7–33](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/prompts/mp-icpd-v0.1.md#L7-L33), [mp-pt-reasoning-v0.1.md L6–22](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/prompts/mp-pt-reasoning-v0.1.md#L6-L22), [mp-pt-concise-v0.1.md L6–19](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/prompts/mp-pt-concise-v0.1.md#L6-L19) |
| Zerlegung mit Werkzeug-Rückkopplung (CR-Agent) | System-Teil (Ziel, Prioritäten, Ausführungsregeln) getrennt von Syntax-Teil (Ausgabegerüst). Ablauf: Vorwissen → Hinweise → Kette aus Zwischenfrage, Skizze, Code, Ausgabe, Antwort → Endlösung. Markdown- und XML-Fassung. | *im Code gefunden* | [cr-agent-assistant-v0.1.md L3–30](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/prompts/cr-agent-assistant-v0.1.md#L3-L30), [cr-agent-xml-v0.2 L1–61](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/prompts/cr-agent-xml-assistant-v0.2.xml#L1-L61) |
| Recursive Meta Prompting (RMP) | Modell verfeinert eigene Prompts; Verfeinerungen als akkumulierte Edit-Historie (formal: Writer-Monade). Im Repo gibt es dafür **keinen Code**, nur die ICPD-Schablone und Live-Demos als Custom GPTs. | *dokumentiert* | [README L83](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L83), [README L96](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L96), [README L200](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L200) |
| Typisierte Ein-/Ausgabe-Slots | Schema mit benannten, MIME-typisierten Eingabe- und Ausgabeslots als multimodale Verallgemeinerung; nur README-Skizze. | *dokumentiert* | [README L113–128](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L113-L128) |
| Programm statt Einzelaufrufe | Game of 24: Das Modell schreibt einmal ein Lösungsprogramm, das dann alle 1362 Rätsel offline löst; Kosten pro Rätsel sinken auf 1/N. | *im Code gefunden* | [gameof24.py L1–60](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Gameof24/gameof24.py#L1-L60), [experiment-log.md L3–9](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Gameof24/experiment-log.md#L3-L9) |

## Artefakte und Formate

- Prompt-Dateien als Markdown mit eingebettetem LaTeX-`tcolorbox`-Block (für Paper-Satz gedacht), dazu eine
  XML-Fassung. Platzhalter in eckigen Klammern; kein Frontmatter, keine Versionierung außer `v0.x` im
  Dateinamen (*im Code gefunden*).
- Mathe-Pipeline: CLI `python -m infer.inference` mit `--prompt_type`, vLLM für lokale Modelle, sonst
  OpenAI-ChatCompletion (alte SDK-Schnittstelle) ([inference.py L317–335](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/infer/inference.py#L317-L335), *im Code gefunden*).
- Keine Skill-/MCP-/API-Schnittstelle.

## Messung und Evaluation

- Antwortvergleich über regelbasierte Normalisierung plus symbolischen Vergleich mit Timeout
  ([grader.py L1–5, L22, L99](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/eval/grader.py#L1-L5), *im Code gefunden*).
- Benchmarkzahlen (MATH 46,3 %, GSM8K 83,5 % mit Qwen-72B base) sind nur *dokumentiert*
  ([README L84](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L84));
  Ausgabedateien sind per `.gitignore` ausgeschlossen, Baseline-Prompts (`cot`, `tora`) liegen nicht im Repo → *offen*.
- Game of 24 „100 %“: Erfolg ist laut Protokoll als „Lösungsmenge nicht leer“ definiert
  ([experiment-log.md L7](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Gameof24/experiment-log.md#L7)).
  Eigener Offline-Check der mitgelieferten `solutions.csv` (Ausdrücke mit `ast` + `Fraction` ausgewertet,
  Zahlenmultimenge geprüft): alle 1362 Rätsel haben mindestens einen gültigen Ausdruck, aber 2034 von
  51 846 gelisteten Ausdrücken (≈ 3,9 %) sind ungültig (z. B. syntaktisch kaputt durch naive
  String-Ersetzung, [gameof24.py L44–45](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Gameof24/gameof24.py#L44-L45)) → *praktisch nachgewiesen*.
  Die 100 % messen also einen deterministischen Brute-Force-Löser, nicht eine LLM-Antwortqualität pro Rätsel.

## Grenzen und Risiken

- Die formalen Garantien (Funktor, Monade) sind Paper-Behauptungen; im Repo ist nichts davon
  implementiert oder testbar (*dokumentiert*, kein Code).
- Herkunft: Inferenz und Grader nennen Microsoft ProphetNet/CRITIC, Hendrycks-MATH und `openai/prm800k`
  als Grundlage, ohne deren Lizenztexte beizulegen ([inference.py L2](https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/Math/infer/inference.py#L2)); mitgelieferte Datensätze
  (GSM8K, MATH, SVAMP, TabMWP …) ohne eigene Lizenzhinweise (*im Code gefunden*).
- Personas mit Superlativ-Zuschreibungen und Imperativ-Großschrift sind Stilmittel ohne gemessene Wirkung im Repo.
- Abhängigkeiten: 8 GPUs/vLLM für Qwen-72B bzw. kostenpflichtige OpenAI-API; alte `openai`-Schnittstelle.

## Clean-Room-Relevanz

- **A1:** Prompt-Schablonen müssen Ablaufstruktur und Ausgabevertrag getrennt von Beispielen ausdrücken
  können (beispielfreier Modus als Standard, Few-Shot optional).
- **A2:** Eine Schablone besteht aus getrennten Teilen *System/Rolle*, *Regeln*, *Ausgabegerüst*; das
  Gerüst ist maschinenprüfbar (JSON/XML-Schema statt Freitext), inkl. eindeutig extrahierbarer Endantwort.
- **A3:** Meta-Operationen auf Prompts (entwerfen aus Dokument, vertiefen, kürzen) als eigene,
  versionierte Skills mit Eingabe „Prompt“ und Ausgabe „Prompt im selben Format“.
- **A4:** Rekursive Verfeinerung nur mit protokollierter Edit-Historie (welche Änderung, warum, mit welchem
  Messwert) und Abbruchbedingung – das, was RMP verspricht, aber nicht liefert.
- **A5:** „Programm erzeugen statt N-mal fragen“ als Ausführungsstrategie für homogene Batch-Aufgaben,
  mit unabhängigem Verifizierer für jede Ausgabe (der Game-of-24-Befund zeigt, warum).
- Nicht übernommen: kategorientheoretische Begründung (kein operativer Nutzen), Persona-Superlative,
  Mathe-spezifische Pipeline. Kategorie: **Verhalten neu implementieren**.

## Offene Punkte

- Paper (arXiv:2311.11482, aktuelle Fassung) gegen README abgleichen: ist RMP dort experimentell belegt?
- Benchmarkwerte nicht reproduziert (benötigt Qwen-72B/GPU); ggf. kleiner Lauf mit lokalem Modell auf
  `math-minival` und eigenem Baseline-Prompt.
- Für das Conductor-/Experten-Muster ein separates Dossier zu Suzgun & Kalai anlegen, falls im Scope.
