# libx 2.3 (synthetisches Fremdpaket)

libx speichert Aufgaben in SQLite und setzt abgebrochene Aufgaben nach einem Neustart fort.
Lizenz: MIT.

## Wiederaufnahme
Nach einem Absturz liest libx die Tabelle `jobs` und startet Aufgaben mit Status `running` erneut.
