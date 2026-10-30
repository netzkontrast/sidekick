# Tor D: Workflow, Hosting und Artefaktspeicher

**Status:** offen · **Bezug:** [Analyse §6, Tor D](../analyse-und-uebernahmeplan.md#tor-d-workflow-hosting-und-artefaktspeicher) · **Zeitbox:** 1–2 Tage (zusammen mit Tor C)

## Frage

Welche Workflow-Engine organisiert Warten und Wiederholungen, in welchem Betriebsprofil läuft der Hub, und wo liegen Artefakte?

Grundsatz: Postgres-Transaktionen definieren fachliche Übergänge. Die Workflow-Engine ruft nur idempotente Commands auf und ist keine zweite Zustandswahrheit.

## Workflow-Engine (Papiervergleich, dann nur die zwei passendsten praktisch testen)

| Kriterium | [Vercel Workflow](https://github.com/vercel/workflow) | [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) | [Restate](https://github.com/restatedev/restate) |
|---|---|---|---|
| Restart-Verhalten | | | |
| Langlebige Freigabe-Wartezeit | | | |
| Idempotenz | | | |
| Export | | | |
| Self-hosting | | | |
| Betriebsaufwand | | | |

## Betriebsprofile

| Profil | Komponenten | Backup/Restore | Laufende Kosten |
|---|---|---|---|
| Privater Server | | | |
| Vercel (optional) | | | |

## Artefaktspeicher (Pflichtkriterien)

- Objektstore hinter eigenem Adapter; „Vercel Blob nutzt S3“ ist kein Nachweis für S3-API-Kompatibilität
- Private Artefakte, autorisierte Downloads, Hash-Prüfung, Backup/Restore
- Am Umsetzungstag prüfen: WS-Verfügbarkeit, Function-Limits, MCP-Auth, Anbieterbedingungen

## Befunde

## Entscheidung

## Offene Punkte

- Offen, 30.10.2026: Den [Vision-v5-Vorschlag](../vision-v5-entwurf.md) für statisches Offline-Frontend, ersten Vercel-Hub und selbst hostbare Alternative prüfen. Speicher-, Lösch- und Backupgrenzen für Episoden, Erinnerungen und Trainingsdaten festlegen; konkrete Hostinglimits vor Umsetzung verifizieren.

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md) (§8): Vercel als erster Hub mit dauerhafter Zustellung außerhalb des Instanz-RAM (V0-FALL-11); statisches Frontend als PWA von stabiler HTTPS-Adresse; Ablage für gesondert löschbare Inhaltsobjekte (V0-INV-11) neben dem Artefaktspeicher.
