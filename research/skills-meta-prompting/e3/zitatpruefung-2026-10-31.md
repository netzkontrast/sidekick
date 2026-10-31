# Zitatprüfung der bisherigen Modellurteile

> Stand 31.10.2026 · Idee aus skills-optimizer (belegpflichtige Gutachten: ein Skript findet die Zitate des Gutachters wieder), clean-room umgesetzt in [verify_quotes.py](verify_quotes.py) (Standardbibliothek, nur lesend).
> Regel: Ein Beleg zählt als verifiziert, wenn jedes Fragment (getrennt an Auslassungszeichen, mindestens 12 Zeichen) wörtlich in der bewerteten Ausgabe oder der Fixture steht; Markdown-Auszeichnung und Leerraum werden normalisiert.

| Bewertung | Zitate | wörtlich gefunden | nicht gefunden |
|---|---|---|---|
| E3 Runde 1, Test ([bewertung](laeufe/test/bewertung-blind.json)) – Grundlage der K-MELDEN-Aktivierung | 101 | **101** | 0 |
| E3 Runde 1, Regression | 25 | 25 | 0 |
| E3 Runde 1, Select | 55 | 49 | 6 |
| M4-Pilot ([bewertung](../eval-runs/m4/bewertung-blind.json)) | 83 | 66 | 17 |

**Deutung:**
- Die Urteile, auf denen die Aktivierung von K-MELDEN beruht, sind vollständig durch wörtliche Zitate gedeckt.
- Im M4-Pilot sind 17 von 83 Belegen Kommentar oder Umschreibung, kein Zitat (z. B. „Keine erfundenen Eigenschaften; …“). Die M4-Aussage „B1 besser in 4 von 6 Paaren“ ist damit schwächer belegt als die E3-Ergebnisse.
- Folge: Bewerter-Prompts verlangen ab jetzt wörtliche Zitate; jede Bewertung wird vor der Entblindung mit diesem Prüfer geprüft. Übernahme in den Harness als eigener Befehl ist Teil des Portierungsplans.
