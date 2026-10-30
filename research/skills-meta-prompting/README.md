# Skills und Meta-Prompting – Recherche

Stand 2026-10-30. Forschungsergebnisse sind keine Implementierungsentscheidungen.

**Forschungsfrage:** Wie lassen sich die Skills und Meta-Prompting-Konzepte aus den unten
gelisteten Repos so integrieren, dass ein Clean-Room-Rewrite ihre wesentlichen Aspekte abdeckt?

## Aktueller Auftrag: lernbare Library im Anwendungskern

Owner-Vorgabe vom 30.10.2026: Die aufeinander aufbauende Skill-Library ist eine Kernfähigkeit innerhalb Sidekicks und ein lernbares Prompt-Framework. Ausführungseinstieg für Claude und einzige Statusablage SL0–SL7: [Library-Research-Plan](library-research-plan.md). Erster Ausführungsauftrag: ausschließlich SL0/SL1, danach Review des Evaluationsdesigns; SL2–SL7 bleiben als Folgepakete geplant. Er nutzt die bestehenden Dossiers und K1–K8, erweitert sie auf neun Skill-Bereiche und trennt Inhaltsoptimierung, Auswahl, Komposition und Modelltraining. Recherche ist beauftragt; Laufzeitarchitektur und Dependencies bleiben zu prüfen.

## Organisation

- [Synthese: Konzeptkarte und Anforderungen](synthese.md)
- [Clean-Room-Plan](clean-room-plan.md)
- [Web-Gegenprüfung mit Primärquellen](web-recherche-2026-10-30.md) (S1–S12, Anforderungen WEB-R1–R10)
- [Dossier-Vorlage](repos/_vorlage.md)

Vorgehen nach den Projektregeln in [AGENTS.md](../../AGENTS.md) (Evidenzstufen, Permalinks auf den
gelesenen Commit, Clean-Room) und nach dem Ablauf des Skills `researching-repositories`
aus PR #4. Die Repos sind Forks unter `netzkontrast/`; gelesen wurde jeweils der genannte Commit.

## Untersuchte Repositories

| Repo | Thema | Commit | Lizenz | Dossier |
|---|---|---|---|---|
| [meta-prompting](https://github.com/netzkontrast/meta-prompting) | Meta-Prompting-Schablonen (Paper Zhang & Yao) | [`dc406ed`](https://github.com/netzkontrast/meta-prompting/tree/dc406edd3855b378c1bb8604ca00397e01ea2513) | MIT | [Dossier](repos/meta-prompting.md) |
| [automatic_prompt_engineer](https://github.com/netzkontrast/automatic_prompt_engineer) | Instruktionen aus Beispielen ableiten (APE-Paper) | [`5f8058c`](https://github.com/netzkontrast/automatic_prompt_engineer/tree/5f8058c041ba271599539069f594f93f92278a1e) | MIT | [Dossier](repos/automatic_prompt_engineer.md) |
| [dspy-advanced-prompting](https://github.com/netzkontrast/dspy-advanced-prompting) | Signaturen, Rollen-Prompts, Optimierer auf DSPy | [`facc1ad`](https://github.com/netzkontrast/dspy-advanced-prompting/tree/facc1ad8db77006fd371ba228ea0dfaf5701f478) | MIT | [Dossier](repos/dspy-advanced-prompting.md) |
| [prompt-architect](https://github.com/netzkontrast/prompt-architect) | Technik-Katalog und Auswahl als Skill | [`6e12013`](https://github.com/netzkontrast/prompt-architect/tree/6e12013eb782042595b99878d66ca46f68fc7885) | MIT | [Dossier](repos/prompt-architect.md) |
| [prompt-engineering-skill](https://github.com/netzkontrast/prompt-engineering-skill) | Prompt-Engineering-Skill (eigenes Material) | [`eec9ca5`](https://github.com/netzkontrast/prompt-engineering-skill/tree/eec9ca5c9c99c9baaa1e5104374139771224fd3f) | keine Datei; eigenes Werk | [Dossier](repos/prompt-engineering-skill.md) |
| [claude-prompts-mcp](https://github.com/netzkontrast/claude-prompts-mcp) | MCP-Server: Prompt-Registry, Templates, Ketten | [`7e1fb3f`](https://github.com/netzkontrast/claude-prompts-mcp/tree/7e1fb3f02a226b232464a5ae98132d25344813dd) | MIT | [Dossier](repos/claude-prompts-mcp.md) |
| [skills-optimizer](https://github.com/netzkontrast/skills-optimizer) | Skill-Kompression mit Inventar und Gates | [`f8082b5`](https://github.com/netzkontrast/skills-optimizer/tree/f8082b57b3138260e9e45767fd6229711362678b) | MIT | [Dossier](repos/skills-optimizer.md) |
| [skill-optimization](https://github.com/netzkontrast/skill-optimization) | Skill-Optimierung mit DSPy (Experiment) | [`6fec081`](https://github.com/netzkontrast/skill-optimization/tree/6fec081ed78a5bcd518d6562ec7452e54ff47aba) | MIT (Platzhalter-Copyright) | [Dossier](repos/skill-optimization.md) |
| [skill-cost-optimizer](https://github.com/netzkontrast/skill-cost-optimizer) | Kostenmodell, Modellwahl, Budgets | [`6c75e0e`](https://github.com/netzkontrast/skill-cost-optimizer/tree/6c75e0eaec6a5a2866799f1ea7bd7100457fe682) | MIT | [Dossier](repos/skill-cost-optimizer.md) |
| [agentic-harness-patterns-skill](https://github.com/netzkontrast/agentic-harness-patterns-skill) | Harness-Muster als Wissens-Skill | [`17549f5`](https://github.com/netzkontrast/agentic-harness-patterns-skill/tree/17549f55b84a94b1ff647ae4711be600fe8ae12f) | MIT (Herkunft klären) | [Dossier](repos/agentic-harness-patterns-skill.md) |
| [recursive-decomposition-skill](https://github.com/netzkontrast/recursive-decomposition-skill) | Rekursive Zerlegung langer Kontexte (RLM) | [`1780d46`](https://github.com/netzkontrast/recursive-decomposition-skill/tree/1780d46a73e485cbad4d0a48c019475d8be9193e) | MIT | [Dossier](repos/recursive-decomposition-skill.md) |
| [code2prompt](https://github.com/netzkontrast/code2prompt) | Codebase → Prompt (CLI/Bibliothek) | [`a520658`](https://github.com/netzkontrast/code2prompt/tree/a520658371751f32fb58b918fbd81cbf0177382d) | MIT | [Dossier](repos/code2prompt.md) |

Upstream, Herkunft und Evidenz stehen jeweils im Dossier.

## Status

- Zwölf Dossiers aus Dokumenten- und Codelektüre. *Praktisch nachgewiesen* ist nur, was in den Dossiers so markiert ist:
  - der Validator und die Tests von prompt-architect (lokal, ohne Installation);
  - `claude plugin validate` für recursive-decomposition-skill;
  - offline-Auswertungen bei meta-prompting, APE und dspy-advanced-prompting.
- Kein Fremdcode wurde für Benchmarks ausgeführt, keine API wurde aufgerufen. Benchmarkzahlen aus den READMEs gelten als unbelegt.
- Ergebnis: [Synthese](synthese.md) mit Konzeptkarte K1–K8 und [Clean-Room-Plan](clean-room-plan.md) mit Stufen und offenen Entscheidungen.
- Nächster Schritt: SL0/SL1 im [Library-Research-Plan](library-research-plan.md) bearbeiten. Die bisherige Repo-Ortsfrage ist durch den Owner-Auftrag geklärt; übrige offene Entscheidungen mit konkreten Vorlagen bearbeiten.
