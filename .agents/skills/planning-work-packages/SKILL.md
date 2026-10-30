---
name: planning-work-packages
description: Zerlege Ziele oder Anforderungen in ausführbare, überprüfbare Arbeitspakete. Nutze diesen Skill für Projektplanung, nächste Phasen, Implementierungspläne, Research-Spikes oder 'break this into tasks'. Nicht für triviale Einzelschritte oder bereits klar geplante Ausführung.
---

# Arbeitspakete planen

1. Lies Ziel, Arbeitsregeln, vorhandene Entscheidungen und den aktuellen Stand. Führe vorhandene Pläne fort; plane abgeschlossene Arbeit nicht erneut.
2. Halte Ergebnis und Nicht-Ziele knapp fest. Trenne bestätigte Vorgaben von Annahmen. Verwandle architekturbestimmende Unbekannte in begrenzte Research-Spikes statt sie stillschweigend zu entscheiden.
3. Schneide Pakete nach unabhängig prüfbaren Ergebnissen. Ordne sie nach echten Abhängigkeiten; beginne mit dem kleinsten durchgängigen Nutzungsablauf. Markiere parallelisierbare Pakete, ohne Agents zu starten.
4. Gib je Paket Ziel, Eingaben/Abhängigkeiten, erwartetes Artefakt oder betroffene Dateien, überprüfbare Abnahme und passenden Nachweis an. Unbekannte Pfade als zu ermitteln markieren; keine erfundenen APIs oder Testbefehle.
5. Ergänze bei riskanten Änderungen Fehlerfälle, Rücknahme und betroffene Schnittstellen. Schätze nur auf Wunsch oder bei Planungsbedarf; benenne Annahmen und Unsicherheit statt Scheingenauigkeit.
6. Prüfe Zielabdeckung, Abhängigkeiten und widerspruchsfreie Schnittstellen. Jedes Paket braucht ein Ergebnis; jedes Abnahmekriterium einen Nachweis. Liefere den nächsten ausführbaren Schritt und die echten Blockaden.

Nutze vorhandene Templates; sonst öffne [Paketform](references/package.md). Schreibe keine Implementierung in den Plan. Plane nur so tief, wie die nächsten Entscheidungen tragen; keine automatische Umsetzung, Veröffentlichung oder zusätzliche Freigabeschleife aus diesem Skill ableiten.
