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

- Rahmenvorgabe (Owner, 30.10.2026): Die Skill-Library gehört als Kernfähigkeit innerhalb Sidekicks. Offen bleibt, wie diese Vorgabe mit Paperclip/OpenHands oder einem eigenen Kern erfüllt wird; Tor A ist damit nicht entschieden. Untersuchungsauftrag: [Library-Research-Plan](../../research/skills-meta-prompting/library-research-plan.md).

- Offen, 30.10.2026: Den [Vision-v5-Entwurf](../vision-v5-entwurf.md) als Erweiterung des Produktziels prüfen: Kontinuität für Vorhaben, Gedächtnis und begrenzte Proaktivität. Für Paperclip/OpenHands und den eigenen Kern denselben Auftrags-/Effektvertrag zugrunde legen; keine Auswahlentscheidung aus dem Entwurf ableiten.

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md) (§8): Der erste durchgängige Ablauf ist `research-report` mit Fake-Runtime, nicht `code-change` ([A-20261030-v0-erster-auftrag](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-erster-auftrag.md)). Der Testauftrag oben bleibt `code-change`; die Kandidaten werden zusätzlich daran gemessen, ob sie die Zustände und Fallmatrix der V0-Spec (V0-FALL-01 bis -17) abbilden können.

- Aus der Skill-Library-Recherche (SL3/SL4, Entwürfe): Skills sind dort versionierte Artefakte mit Inhaltshash, Lauf-Pinning und Aktivierung nur durch den Owner am Hash ([Kompositionsvertrag](../../research/skills-meta-prompting/library-composition.md) §2, §5; [Lernvertrag](../../research/skills-meta-prompting/library-learning.md) §5). Offen ist, ob ein Kandidat das im Kriterium „Auftrags-/Artefaktmodell“ abbilden kann und ob ein Ablauf aus Skills ein eigenes Artefakt oder ein Auftrag mit Schritten ist (SL3 O-4).
