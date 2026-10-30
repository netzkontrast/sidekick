# Entscheidungen

Entscheidungsprotokolle für Phase 0 (siehe [Analyse §6](../analyse-und-uebernahmeplan.md#6-rechercheverfahren-und-entscheidungstore)).
Die [Vision](../vision.md) bleibt als Ausgangsdokument unverändert. Was hier entschieden wird, gilt vor der Vision.

| Nr. | Entscheidung | Status | Vision §26 |
|---|---|---|---|
| [A](tor-a-erweiterung-oder-eigener-kern.md) | Paperclip/OpenHands erweitern oder eigener Kern? | offen | Bauen vs. Paperclip erweitern |
| [B](tor-b-claude-anbindung.md) | Claude-Anbindung: Claude ACP, Agent SDK oder strukturierte CLI | offen | ACP-Adapter oder Agent SDK |
| [C](tor-c-transport-und-haltbarkeit.md) | Connector-Transport und lokales Journal | offen | Long-Poll + SSE oder WSS |
| [D](tor-d-workflow-hosting-artefakte.md) | Workflow-Engine, Betriebsprofil, Artefaktspeicher | offen | Vercel Workflow vs. trigger.dev vs. Restate |

Status: `offen` → `in Prüfung` → `entschieden` (oder `weiterer Spike nötig`).

## Grundsatzentscheidungen des Owners

| Datum | Entscheidung | Begründung / Folge |
|---|---|---|
| 30.10.2026 | **Erste Runtime ist Claude Code**, sowohl für Adaptervertrag als auch MVP-Abnahme. Goose folgt als zweite Runtime (Phase 2). | Bestätigt Vision §26. Damit liegt Tor B (Auth-Pfad, Nutzungsbedingungen) auf dem kritischen Pfad. Vorschlag P3 der [Reflexion zur ChatGPT-Spec](../../research/agent-hub/inputs/2026-10-30-reflexion-chatgpt-spec.md) ist damit abgelehnt. |
| 30.10.2026 | **Recherche, Spec und Implementierung bleiben in diesem Repo** (`netzkontrast/sidekick`). | Clean-Room wird über Regeln gesichert, nicht über Repo-Trennung: kein Fremdcode, keine fremden Prompts/Fixtures; `research/` bleibt außerhalb von Build- und Testpfaden. Vorschlag P8 ist damit entschieden. |

## Aufbau eines Protokolls

1. **Frage** und Bezug zur Analyse
2. **Kandidaten** mit Version/Commit
3. **Kriterien** und Gewichtung, harte Ausschlüsse
4. **Befunde**, jeweils markiert als *dokumentiert*, *im Code gefunden*, *praktisch nachgewiesen* oder *offen*; Verweis auf Dossiers und Tests
5. **Entscheidung** mit Begründung, verworfenen Alternativen und Folgen
6. **Offene Punkte**
