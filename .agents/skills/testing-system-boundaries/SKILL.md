---
name: testing-system-boundaries
description: Leite aus Spezifikationen prüfbare Ausfall- und Grenztests für zustandsbehaftete oder verteilte Abläufe ab und bewerte ihre Rohbelege. Trennt Zustellung, Laufzustand und tatsächliche Wirkung und ordnet jedem Test die schwächste sichere Umgebung zu. Nutze bei „Ausfalltests ableiten“, „Fehlermatrix“, „was passiert bei doppelter Zustellung oder verlorener Antwort“, „Idempotenz oder Fencing prüfen“, „failure matrix“, „chaos test plan“, „test stale epochs“. Nicht für Unit-Tests zustandsloser Funktionen, Debugging eines einzelnen Fehlers, Last- oder Sicherheitstests oder Störungen produktiver Systeme.
---

# Systemgrenzen testen

1. Lies Spec, Zustandsmodelle, vorhandene Fehlerfälle und Testregeln. Arbeite mit stabilen Anforderungs-IDs; fehlen sie, melde die Lücke statt Fälle zu erfinden.
2. Bestimme je Fall Störungsklasse und Injektionspunkt aus der [Matrix](references/failure-matrix.md). Führe „Wirkung eingetreten, Bestätigung verloren“ immer als eigenen Fall.
3. Lege drei getrennte Sollwerte fest: Zustellung, Laufzustand, Wirkung. „Unklar, Abgleich nötig“ ist ein gültiges Soll.
4. Wähle die schwächste ausreichende Umgebung: In-Process-Fake, isolierte Umgebung mit eigenen Test-Zugangsdaten oder freigegebenes Testziel. Störe produktive Prozesse, Konten oder Netze nie ohne Freigabe für genau diese Aktion. Ein separates Arbeitsverzeichnis ist keine Isolation.
5. Definiere vor der Ausführung deterministische Assertions und den Ort jedes Rohbelegs. Ein Logsatz oder Modellurteil allein belegt keinen Grenzfall.
6. Führe nur im erlaubten Rahmen aus, sonst übergib den Plan. Halte Befehl, Version, Umgebung und Beleg fest. Fehlende oder abgeschnittene Belege heißen „nicht beobachtbar“, nie „bestanden“.
7. Bewerte je Fall und Ebene: bestanden, fehlgeschlagen, blockiert, nicht ausgeführt. Ein Rechte- oder Freigabeverstoß ist immer ein Fehlschlag.
8. Liefere Matrix, Belegverweise, offene Fälle mit benötigter Umgebung und den kleinsten nächsten Versuch. Leite keine Garantie über die getesteten Fälle hinaus ab, auch kein „genau einmal“.
