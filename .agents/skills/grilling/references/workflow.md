# Persistenter Interview-Workflow

## Ablage

Konfigurierte Projektablage verwenden. Sidekick: `docs/fragen/`.
- `README.md`: Einstieg und Themenlinks.
- `<thema>/index.md`: Ziel/Umfang, Kontextversionen, Bearbeiter, Sessionstatus, Frageübersicht, nächste Runde.
- `<thema>/questions/<id>.md`: kanonische Frage einschließlich Antwortverlauf.
- `<thema>/rounds/<round-id>.md`: nur bei Tool-Zustellung; gestellte Fragen, Feld-Zuordnung und Antwortquelle. Chat-Runden kompakt im Themenindex protokollieren.

Keine getrennten Antwortkopien oder parallelen offenen-Fragen-Dateien. Der Themenindex listet nur Links und Kurzfragen. Status, Prüfbedarf und Abhängigkeiten stehen ausschließlich in den Frage-Dateien; Sessionstatus nur im Themenindex.
IDs folgen `Q-<YYYYMMDD>-<eindeutiges Suffix>` bzw. `R-<YYYYMMDD>-<eindeutiges Suffix>`. Das Suffix darf sprechend sein, etwa `input-expiry`, oder Uhrzeit plus Zufallsteil enthalten, etwa `143000-k7`. IDs einmal vergeben, nie umnummerieren. Vor Anlage Kollision prüfen; bei paralleler Arbeit eindeutiges Suffix wählen. Konflikte beim Commit nicht durch Überschreiben lösen.

## Zustände

Frage: `open → asked → answered`; zusätzlich `deferred` und `superseded`.
- `open`: gesammelt, noch nicht erfolgreich gestellt.
- `asked`: nachweislich gestellt, Antwort fehlt.
- `answered`: zugeordnete echte Antwort liegt vor.
- `deferred`: ausdrücklich vertagt, mit Grund und Wiederaufnahmebedingung.
- `superseded`: durch andere Frage ersetzt, mit Verweis.
`needs_review: true` ist unabhängig davon möglich. Alte Antworten bleiben sichtbar, sind aber keine gültige Voraussetzung, bis die Prüfung abgeschlossen ist.
Eine Frage darf nur als answered geführt werden, wenn mindestens ein Antwort-Eintrag mit Quelle existiert.

Session: `active | waiting_user | blocked_research | paused | awaiting_confirmation | complete`.
`complete` verlangt bestätigte Zusammenfassung und keine relevanten offenen/ungeprüften Fragen; vertagte Fragen bleiben als ausgeschlossene Restpunkte sichtbar.

## Runden

1. Kontextstand und vorhandene Antworten prüfen, neue Fragen erfassen.
2. Voraussetzungen sind erfüllt, wenn alle genannten Frage-IDs beantwortet und nicht prüfpflichtig sind; erforderliche Sachbelege ebenfalls prüfen. Zyklen oder fehlende IDs sichtbar reparieren.
3. Fragbare Menge nach Priorität sortieren. Bei Tool-Limits in unabhängige Teilrunden aufteilen, statt Folgeantworten zu erraten.
4. Bei Tool-Zustellung eine Runde als `prepared` mit Frageversionen und Feld-Mapping anlegen; Fragen bleiben open. Im Chat genügt ein kompakter Eintrag im Themenindex mit R-ID und Frageversionen. Tool nach Schema aufrufen bzw. im Chat fragen.
5. Nach tatsächlicher Zustellung Runde `sent`, Fragen asked. Bei Toolfehler Runde `failed`, noch nicht gestellte Fragen bleiben open; ggf. Chat-Fallback mit eigener R-ID im Themenindex.
Bei Unterbrechung zwischen Aufruf und Ergebnis ist Zustellung unbekannt: vorhandene Tool-/Chat-Spuren abgleichen, nicht automatisch erneut senden oder eine Antwort erfinden.
6. Antwortquelle mit Tool/Message-ID und Zeitpunkt vermerken, soweit verfügbar; sonst fehlende IDs offen benennen. Tatsächlichen Wortlaut oder eindeutig als sinngemäß markierte Antwort erfassen. Nur betroffene Fragen auf answered setzen; Runde bei Teilantworten `partial`.
7. Empfehlung und Antwort getrennt halten. Bei ausbleibender Antwort warten oder unabhängige Arbeit fortsetzen. Keine automatischen Defaults.
8. Nach Korrektur alte Antwort behalten, neue Antwort anhängen; transitive Folgefragen und verlinkte Entscheidungen zur Prüfung markieren. Keine entschiedene ADR still ändern.

## Abschluss und Übergabe

Zusammenfassung mit geklärten IDs, offenen/vertagten Punkten, Restannahmen und Auswirkungen vorlegen. Bestätigung samt Quelle speichern. Bei begrenztem Umfang Grenzen nennen; kein Interview ohne Abbruchmöglichkeit.
Fachentscheidungen erst entsprechend Projektregeln nach `docs/entscheidungen/` überführen; Frage/Antwort als Beleg verlinken. Antworten sind keine Tool-/Merge-/Deploy-Freigaben.
In Sidekick später Auftrag/Schritt/Run als optionale Referenzen führen. Zukunftsziel: adapterfähige Human-Input-Interaktionen, keine Behauptung einer schon implementierten Runtime.

Nur projektbezogene, für Speicherung geeignete Antworten ablegen. Secrets und sensible persönliche Rohantworten nicht ins öffentliche Repo schreiben; redigierten Vermerk und zulässige private Referenz verwenden. Keine ungefilterten Tool-Payloads archivieren.
