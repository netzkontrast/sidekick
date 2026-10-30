# Gemeinsames Testprotokoll

Status: geplant, noch nicht ausgeführt.

Fixture: kleines Git-Repo mit zwei Dateien, fixierter Base-SHA, absichtlich fehlschlagendem Check. Auftrag → Implementierung → Checks → Nacharbeit → separater Reviewer → menschliche Abnahme → PR als kontrollierter Effekt.

Für Paperclip und OpenHands dieselben Eingaben und Budgets. Dauer, Konfiguration, Befunde und unvermeidliche Eingriffe festhalten.

| Störung | Abnahme |
|---|---|
| Doppelter Claim | Ein gültiger Bearbeiter |
| Alte Epoch | Einreichung und kontrollierte Effekte abweisen |
| Netzwerkverlust | Events mit stabilen IDs nachliefern |
| Connector stirbt | Zustand des Kindprozesses abgleichen, kein blinder Neustart |
| Runtime stirbt | Resume oder expliziter neuer Versuch mit Übergabe |
| Freigabeparameter geändert | Neue Freigabe erforderlich |
| PR erstellt, Antwort verloren | Reconciliation; keine zweite PR |
| Rechte widerrufen | Neue Aktionen sperren, laufende abgleichen |
| Zielbranch verändert | Konflikte und Checks erneut prüfen |

Zuerst Fake-Runtime/Effect-Service, danach kleine Live-Probe. Fehlende Credentials und nicht ausgeführte Tests als offen protokollieren.
