# Tor A: Erweiterung oder eigener Kern?

**Status:** offen · **Bezug:** [Analyse §6, Tor A](../analyse-und-uebernahmeplan.md#tor-a-erweiterung-oder-eigener-kern) · **Zeitbox:** 2–3 Tage (zusammen mit Tor B)

## Frage

Lässt sich der Nordstern-Ablauf über unterstützte Erweiterungspunkte von Paperclip oder OpenHands abbilden, mit weniger Gesamtaufwand (einschließlich Upgrades) als ein eigener Domänenkern?

## Kandidaten

| Kandidat | Commit/Release | Dossier |
|---|---|---|
| [Paperclip](https://github.com/paperclipai/paperclip) | – | – |
| [OpenHands](https://github.com/OpenHands/OpenHands) | – | – |
| Eigener Kern + vorhandene Runtimes | – | – |

## Testauftrag (identisch für alle)

Winziges Testrepo, benannter Ausgangscommit, Änderung an zwei Dateien, bewusst fehlschlagender Check, Nacharbeit, unabhängiger Review, Abnahme und PR als separater Effekt. Gleiche Eingaben und Budgets; Aufwand und verbleibende Lücken erfassen.

## Kriterien

| Kriterium | Gewicht | Paperclip | OpenHands |
|---|---|---|---|
| Auftrags-/Artefaktmodell | 25 % | | |
| Kontrollierte Effekte/Rechte | 25 % | | |
| Wiederherstellung | 20 % | | |
| Adapterfähigkeit | 15 % | | |
| Privater Betrieb/Export | 10 % | | |
| UI-Anpassbarkeit | 5 % | | |

**Harte Ausschlüsse** (übersteuern den Score): nicht verhinderbare Außenwirkung bei behauptet kontrollierten Runs · unklarer Zustand nach Restart · fehlender Datenexport · invasive Kernumbauten bei jeder Erweiterung.

## Befunde

## Entscheidung

## Offene Punkte

- Offen, 30.10.2026: Den [Vision-v5-Entwurf](../vision-v5-entwurf.md) als Erweiterung des Produktziels prüfen: Kontinuität für Vorhaben, Gedächtnis und begrenzte Proaktivität. Für Paperclip/OpenHands und den eigenen Kern denselben Auftrags-/Effektvertrag zugrunde legen; keine Auswahlentscheidung aus dem Entwurf ableiten.
