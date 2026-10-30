# Dossier: <Repo-Name>

> Vorlage nach [Analyse §6](../../analyse-und-uebernahmeplan.md#einheitliches-repo-dossier). Datei kopieren als `<repo-name>.md`.
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier wird beobachtbares Verhalten beschrieben, keine Fremdimplementierung übersetzt.

| Feld | Wert |
|---|---|
| URL | |
| Commit-SHA | |
| Release / Datum | |
| Lizenz(en), Notices, Assets | |
| Priorität / Tor | P0 · Tor A/B/C/D |
| Geprüft am / von | |

## Startanleitung

Reproduzierbare Schritte vom frischen Klon bis zum laufenden System.

## Öffentliche Verträge

APIs, Protokolle, Erweiterungspunkte, die wir nutzen würden.

## Persistenz

Wo liegt welcher Zustand? Wer besitzt ihn?

## Credential-Fluss

Welche Credentials werden wo gespeichert und an wen weitergegeben?

## Sicherheitsgrenzen

Was ist isoliert, was nicht? Kann ein Agent kontrollierte Effekte umgehen?

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Netzwerkunterbrechung | | |
| Prozess-/Connector-Neustart | | |
| Doppelte Zustellung | | |
| Rechteentzug | | |

## Tests

| Test (Analyse §8) | Ergebnis | Belegpfad |
|---|---|---|

## Bewertung für den Hub

Kategorie nach Analyse §4: Integrieren · Als Dependency nutzen · Verhalten neu implementieren · Lizenziert übernehmen · Zurückstellen

## Offene Punkte
