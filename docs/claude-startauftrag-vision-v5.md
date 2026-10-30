# Bauauftrag für Claude – Sidekick v5 prüfen und konkretisieren

> 30.10.2026 · Vorschlag zur Ausführung nach Review des [Vision-Entwurfs](vision-v5-entwurf.md).
> Grundlage: [Machbarkeitsbericht](research/vision-v5-machbarkeit.md), bestehende [Analyse](analyse-und-uebernahmeplan.md) und [Entscheidungstore](entscheidungen/README.md).
> Dieser Auftrag legt keine neue Dependency fest und autorisiert kein Deployment, keinen Merge oder Betrieb auf dem Nutzer-PC.

## Dein Ziel

Baue auf einen persönlichen Arbeitsraum hin, der Vorhaben über Geräte und Unterbrechungen trägt. Beweise zuerst einen kleinen vollständigen Ablauf und einen frühen lokalen Lernversuch. Die Vision beschreibt das Erlebnis; Vertrag, Journal und Freigabetor sichern es ab.

Lies zuerst `AGENTS.md`, die drei hier verlinkten Dokumente und den aktuellen Research-Plan. Prüfe seit dem Recherchecommit neue Änderungen und den Status von PR #5/#6. Verwende vorhandene Skills bedarfsweise. Bestehende Recherche nicht neu beginnen.

Fremdimplementierungen werden nicht übersetzt. Implementiere gegen die eigene Verhaltensspec und synthetische Fixtures. Lies als implementierender Agent zunächst die eigenen Anforderungen; vollständige Trennung von Recherche und Implementierung ist eine Prozessentscheidung, kein hier behaupteter juristischer Clean-Room-Nachweis.

## Der erste durchgängige Ablauf

Ein Nutzer erfasst per Text, später Sprache, einen Rechercheauftrag. Ein gepairter Connector erhält ihn; zunächst bearbeitet eine Fake-Runtime den Auftrag und liefert ein prüfbares Artefakt. Nach einer absichtlich getrennten Verbindung wird der tatsächliche Zustand abgeglichen. Ein zweiter Browser beantwortet eine offene Frage. Der Auftrag wird abgenommen; ein belegter Erinnerungskandidat lässt sich bestätigen, korrigieren oder verwerfen.

Danach ersetzen wir die Fake-Runtime durch den in Tor B geprüften Claude-Code-Adapter. Sprache, echte Geräte und Modelltraining ergänzen denselben Ablauf. Kein ungesichertes Shell-Tool oder offener Modellserver als Abkürzung.

## Pakete in Abhängigkeitsreihenfolge

| Paket | Eingabe und Abhängigkeit | Ergebnis | Abnahme und Nachweis |
|---|---|---|---|
| **V0 – Ziel und Verträge** | Bestehende Tore, Vision-Review | Kleine Verhaltensspec mit IDs; Auftrags-, Effekt-, Geräte- und Erinnerungsschemas; aktualisierte offene Entscheidungen | Jeder Zustand und Autoritätswechsel hat ein Beispiel. Offline-, Widerrufs- und unklare Ausgangsfälle sind beschrieben. Keine stillschweigende Entscheidung für ein Framework. |
| **V1 – Kern im Testbetrieb** | V0; Befunde Tor A | Auftrag, Claim/Epoch, Rückfrage, Journal, Effektfreigabe und Fake-Runtime | Doppelte Zustellung erzeugt keine zweite gültige Übernahme. Alter Claim darf keinen Effekt ausführen. Geänderte Parameter entwerten Freigabe. Verlorene Effektantwort wird abgeglichen. Contract-Test-Protokoll. |
| **V2 – Offline-Arbeitsraum** | V0; abgestimmter Speicherkandidat | Statisch gebautes Frontend mit Jetzt/Vorhaben, lokalem Entwurf und sichtbarem Sync-Status | Nach Erstinstallation ohne Netz startbar; Entwurf überlebt Reload; Wiederverbindung verliert oder verdoppelt ihn nicht. Browserprüfung mit dokumentierter Version. |
| **V3 – Geräteverbindung** | V1/V2; Tor C/D und Pairing-Spec | Ein Connector, erneuerbarer Kanal, durable Zustellung; zweiter Client | Hub-Instanzwechsel, PC offline, Reconnect und Tokenwiderruf sichtbar testen. Keine Modellports öffentlich. Gemessene Verbindungskosten und Datenwege festhalten. |
| **V4 – Echte Arbeit und Sprache** | V3; Tor B; separater Hardwarezugang | Claude Code über geprüften Adapter, optional lokales ASR mit Textfallback | Ein echter kleiner Auftrag mit Belegen, gezielter Rückfrage und Abnahme. Deutsches Diktat bleibt korrigierbar. Cancel und Prozessverlust zeigen den nachgewiesenen Zustand. |
| **V5 – Belegtes Gedächtnis** | V1/V2, Erinnerungsspec | Episoden → Kandidaten → Bestätigung → gezieltes Retrieval | Widerspruch, Korrektur und Rückzug entfernen den Inhalt aus neuem Kontext. Quellen bleiben sichtbar. Kein Rohdatenimport in öffentliches Git. |
| **N0 – Früher Needle-Versuch** | V0s enger Tool-Katalog; V1–V4 nicht erforderlich | Versionierter synthetischer Datensatz, Regeln/Basismodell/Fine-Tune-Vergleich | Deutsche und negative Fälle; unabhängiger Testsatz; tatsächliche GPU-Zeit, Qualität und Exportgröße. Kein Produktionsmodell automatisch ersetzen. |
| **V6 – Begrenzte Proaktivität** | V3–V5, Signal-/Budgetspec | Ein abonnierter Trigger, etwa neue PR-Kommentare, mit Digest | Doppelte Signale erzeugen keinen Hinweissturm. Warum, Aktualität, Ruhezeit, Snooze und Abschalten prüfen. Neue Außenwirkung benötigt passenden Grant. |

N0 ist bewusst früh und unabhängig vom fertigen Hub möglich. Dafür zuerst Modell-/Runtime-Artefakte und Lizenzen inventarisieren; Ausführung auf der Hardware separat einrichten. Es gibt keinen Auftrag, den PC aus dieser Recherche heraus zu installieren oder fernzusteuern.

## Der nächste kleine Schritt

Erstelle **V0** als reviewbaren Spec-PR. Begrenze die erste Entscheidungsvorlage auf drei Punkte:

1. Trägt das Produktziel „Kontinuität für Vorhaben“, mit „Vertrag, Journal, Tor“ als Kern?
2. Darf die erste Version lokale Inferenz über den Connector und ein statisches Offline-Frontend vorsehen?
3. Welcher durchgängige Auftrag liefert zuerst Nutzen: Recherche mit Artefakt oder kleine Codeänderung?

Nutze native AskUser-/Rückfragewerkzeuge, wenn sie verfügbar sind und eine Antwort die Umsetzung tatsächlich bestimmt. Dokumentiere jede Frage mit ID, kurzem Anlass, Optionen, Antwort oder offenem Status, Auswirkung und Bezug zur Spec. Nach Merge von PR #5 dessen kanonische Fragenablage verwenden; davor keine konkurrierende Ablage anlegen. Keine internen Gedankengänge protokollieren.

Technische Unbekannte gehören als begrenzter Versuch in bestehende Tore. Frage nicht jede reversible Implementierungskleinigkeit ab. Neue Dependencies und Änderungen der Doku-Struktur brauchen nach `AGENTS.md` eine konkrete Entscheidungsvorlage.

## Prüfkriterien für den Lernversuch

Trainiere Vorschlagsverhalten, keine persönlichen Geheimnisse oder wechselnden Fakten. Friere Tool-Katalog, Datenfassung, Splits, Versionen und Testkriterien vor dem Training ein. Erzeuge Varianten erst nach der Split-Zuordnung, um Herkunftslecks zu vermeiden.

Berichte exakte Tool-/Argumentrichtigkeit, Klärungsfälle, Fehler ohne passenden Tool Call, Latenz und Speicher. Prüfe das exportierte quantisierte Modell statt nur Trainingsloss. Teste die Policy unabhängig: Auch ein falscher Modellvorschlag darf keine unerlaubte Aktion auslösen.

Vorgeschlagenes Aktivierungstor: Vorteil gegenüber der eingefrorenen Baseline auf dem vereinbarten Testsatz, kein unerlaubt ausgeführter Effekt in den Policy-Tests, akzeptable gemessene Latenz und vorhandener Rücknahmeweg. Vor dem Lauf konkrete Schwellen und Stichprobengröße vereinbaren; keine Erfolgsdefinition nach Sichtung der Ergebnisse ändern.

## Betrieb und Rücknahme

Versioniere Verträge, Speicher-Schema, Modell, Prompt und Skill getrennt. Feature-Schalter erlauben den Rückweg zu Text, Fake-Runtime oder Basismodell. Eine Deaktivierung ist kein Beleg, dass ein externer Prozess schon gestoppt wurde; Cancel-Anforderung und Bestätigung separat zeigen.

Nutzerinhalte liegen außerhalb des Quellrepos. Synthetische Fixtures dürfen hinein. Für Logs, Caches, Audio, Backups und Trainingsdaten existiert vor echtem Einsatz ein dokumentierter Datenweg und Löschablauf.

## Fertig bedeutet

Der PR erklärt Verhalten, betroffene Verträge, tatsächlich ausgeführte Checks und offene Grenzen. Ein Demo-Video allein ersetzt keine Ausfallprüfung. Kein unbelegtes „genau einmal“, „vollständig offline“, „lernt jede Nacht“ oder „immer erreichbar“.

Liefere jeweils ein überprüfbares Paket, die passenden Belege und den nächsten konkreten Schritt. Der volle Visionumfang ist keine Aufgabe für eine einzige Sitzung.
