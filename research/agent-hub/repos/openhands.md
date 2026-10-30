# openhands

Stand 2026-10-30. Referenzcommit: d64346523b92c9b3128994ad4a0b46d576afbfbc.
Quelle gelesen: https://github.com/OpenHands/OpenHands/blob/main/README.md (beweglicher Branch; exakte Commit-Fassung als nächster Prüfschritt). Repository-Snapshot: https://github.com/OpenHands/OpenHands/commit/d64346523b92c9b3128994ad4a0b46d576afbfbc

Evidenz: Dokumentation gelesen, keine praktische Validierung.

## Erste Befunde

Agent Canvas ist Oberfläche und lokale Stack-Orchestrierung. Agent Server und kanonische API liegen in OpenHands/software-agent-sdk; Browser-Client in OpenHands/typescript-client; Scheduling/Webhooks in OpenHands/automation. Eine alleinige Canvas-Prüfung reicht deshalb nicht.

README unterscheidet Host-Ausführung, Docker und einen Container pro Conversation. Persistierte Conversation-Daten überleben laut Dokumentation Containerersatz; gemeinsam eingebundene Workspaces bleiben gemeinsam. Das beweist kein Exactly-once-Verhalten.

## Nächste Prüfung

Die drei weiteren Repos pinnen. Autoritative Session-/Event-Persistenz und ACP-Permissions im SDK prüfen. Idempotenz von Automation-Dispatch und Trennung von Abnahme/Übernahme untersuchen. Vorläufig Integration des Servers prüfen, Canvas nicht als vollständigen Hub gleichsetzen.
