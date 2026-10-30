# Sidekick: PR-Abgleich am 30.10.2026

Geprüft: Patch-Inventar PR #1–#4, aktueller main-Stand afee9abbb7085c860caacd7b4a87831b5f584e8e,
AGENTS.md, vorhandene Vision/Analyse sowie Änderungen der offenen PRs #3 und #4.
Keine Runtime-Ausführung oder Merge-Freigabe.

| PR | Stand | Ergebnis |
|---|---|---|
| [#1](https://github.com/netzkontrast/sidekick/pull/1) | gemergt | Grundlage vorhanden; README enthält noch vorläufige Stackannahmen, die Tor C/D nicht vorentscheiden dürfen |
| [#2](https://github.com/netzkontrast/sidekick/pull/2) | gemergt | Research-Ablage erklärt; lange AGENTS.md ist Wartungsthema, kein funktionaler Blocker |
| [#3](https://github.com/netzkontrast/sidekick/pull/3) | offen, a3233d6b230377586e8b64aa968ce95e6e26e71f | Nützliche Reflexion, Planungsinput ausdrücklich noch keine normative Entscheidung |
| [#4](https://github.com/netzkontrast/sidekick/pull/4) | offen, 1abebdec7455bcbe4c8f7865acb256ec0d56e75a | Portable Skills; Live-Discovery/Verhalten ausdrücklich ungetestet; Grilling ergänzt sie ohne Abhängigkeit |

## Konkrete Befunde

1. **PR #3, README „Managed vs. Attached“:** „Volle Garantien“ allein aus „selbst startet und kontrolliert“ ist zu weit.
   Managed Start beweist keine effektive Shell-/Netzwerk-/Credential-Isolation.
   Formulierung auf die definierte Fehlermatrix und tatsächlich durchgesetzte Ausführungsgrenze einschränken.
2. **PR #3, Reflexion §3.4:** Aus Goose-Lizenz/ACP folgt nicht, dass Abo-/Provider-Bedingungen entfallen.
   Runtime-Lizenz und Auth-/Providervertrag getrennt prüfen. Als technische Vertragsprobe kann Goose trotzdem sinnvoll sein.
3. **PR #3, Input-Spec vs. bisheriger Plan:** Goose zuerst, fehlender Apply-Schritt, Playbooks und Datenklassen sind
   durch die Reflexion bereits als Unterschiede erkannt. Bis Owner-/Tor-Entscheidung bleibt Claude Code erste
   Produkt-Runtime; nicht den eingebetteten Startauftrag als aktuellen Implementierungsauftrag ausführen.
4. **PR #4 und Grilling:** Beide ergänzen AGENTS.md unmittelbar vor CodeGraph. Beim Zusammenführen beide Router
   erhalten. Gemeinsame .agents-Quelle und .claude-Symlinks verwenden; keine voneinander abweichenden Skillkopien.
5. **PR #4, Qualität:** Fixtures sind noch keine Modelltests. Grilling ergänzt eigene Zustands-/Fehlerfälle,
   ersetzt aber nicht den geplanten frischen Client-Lauf für implizite Auswahl.

## Integration

PR #3 kann fachlich unabhängig behandelt werden, mit den beiden Präzisierungen oben.
PR #4 und Grilling sind unabhängig von main aus reviewbar; der zweite Merge kann eine
kleine AGENTS.md-Konfliktauflösung brauchen. Kein Merge wurde ausgeführt.
Neue Entscheidungen aus Interviews gehören weiter in docs/entscheidungen; offene Fragen
in docs/fragen. Vorschläge in Planungsinputs werden nicht allein durch Ablage verbindlich.
