# Fragen und Antworten

Persistente Klärungen für die Entwicklung von Sidekick und später für dessen strukturierte Agent-Arbeit.
Der Skill [grilling](../../.agents/skills/grilling/SKILL.md) führt Interviews mit nativen
AskUser-Werkzeugen, soweit verfügbar und zulässig, andernfalls im Chat.

## Einstieg

1. Vorhandenes Thema und dessen Index öffnen.
2. Quellen und bereits gegebene Antworten lesen.
3. Nur unabhängige, jetzt beantwortbare Fragen stellen.
4. Antworten und ihre Herkunft an der jeweiligen Frage ergänzen.
5. Übersicht aktualisieren; fachliche Entscheidungen ins bestehende Entscheidungsregister verlinken.

Der [Workflow](../../.agents/skills/grilling/references/workflow.md) definiert Zustände,
Wiederaufnahme und Korrekturen. [Formate](../../.agents/skills/grilling/references/records.md)
dienen als Vorlage. Themen und Fragen erst bei realem Bedarf anlegen. Separate Runden-Dateien sind nur bei
Tool-Zustellung nötig; Chat-Runden kompakt im Themenindex protokollieren.

| Thema | Inhalt |
|---|---|
| [Human-Input-Vertrag](human-input/index.md) | Vorbereitete Fragen für Phase 0b; noch nicht gestellt |
| [V0 – Ziel und Verträge](v0-ziel-und-vertraege/index.md) | Drei Vorentscheidungen zur V0-Spec (Vision v5) |

Die Ablage ist öffentlich. Keine Secrets, persönlichen Rohdaten oder ungefilterten
Chat-/Tool-Protokolle committen. Gründe bedeuten kurze sachliche Anlässe, Quellen und
Konsequenzen; kein internes Denkprotokoll.

## Zusammenarbeit und spätere Runtime

Repo-Skills organisieren zunächst Entwicklungsarbeit. Das Modell aus Frage-ID,
Frageversion, Auftragsbezug, Zustellung und Antwortquelle kann später als Anforderung
an `tasks.request_input` dienen. Dies ist kein implementierter Hub-Adapter.
Antworten, fachliche Entscheidungen und Ausführungsfreigaben bleiben getrennt.
Bestehende Zustimmung wird berücksichtigt; allein eine Empfehlung oder ausbleibende
Antwort kann keine Zustimmung erzeugen.
