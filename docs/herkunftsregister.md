# Herkunfts- und Übernahmeregister

Jede fremde Software, die der Hub integriert, als Dependency nutzt oder deren Code übernommen wird, steht hier (siehe [Analyse §4 und §10](analyse-und-uebernahmeplan.md#4-was-portieren-hier-heißen-soll)).
Lizenzen, Assets und Notices werden am gewählten Commit inventarisiert. Dies ist eine technische Prozessdefinition, keine rechtliche Bewertung.

**Kategorien:** Integrieren · Als Dependency nutzen · Verhalten neu implementieren · Lizenziert übernehmen · Zurückstellen

| Quelle | Version/Commit | Lizenz | Kategorie | Eigener Vertrag / Schnittstelle | Update-Verantwortung | Entscheidung |
|---|---|---|---|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa) | a496f5513d4a4cf889bc48e189e579f4b0bdf6aa | MIT, Copyright Matt Pocock 2026 | Verhalten neu implementieren | grilling + AskUser + versionierte Fragenablage | Maintainer des Skills | Eigenständige Neuformulierung; keine Fremdtexte kopiert |

Code aus fremden Repos wird nur in der Kategorie *Lizenziert übernehmen* und nach separater Entscheidung kopiert; die Herkunft steht dann zusätzlich im Commit und am Code.

## Grilling: Quellenprüfung und Grenzen

Geprüft: `skills/productivity/grilling/SKILL.md`, `docs/productivity/grilling.md`,
`skills/engineering/grill-with-docs/SKILL.md`, `LICENSE` am oben genannten Commit.
[Abdeckung und Abweichungen](research/grilling-port.md). Die eigenständige
Verhaltensumsetzung ist keine personell getrennte juristische Clean-Room-Zertifizierung:
Der implementierende Agent hat die Quelle gelesen.
