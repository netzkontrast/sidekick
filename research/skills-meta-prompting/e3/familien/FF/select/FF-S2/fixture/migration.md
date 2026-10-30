# Umzug der Lagerverwaltung „Regal“ (synthetisch)

Bereits festgelegt: Umstellung nur im Wartungsfenster sonntags 02:00–05:00.

Offene Punkte:
- A: Ziehen wir auf PostgreSQL oder bleiben wir bei SQLite mit einer Datei pro Standort?
- B: Welche Backup-Strategie nutzen wir? (Point-in-Time-Recovery gibt es nur
  bei PostgreSQL; bei SQLite käme nur ein nächtliches Dateikopieren in Frage.)
- C: Sollen die Anwendungslogs als JSON oder als Klartext geschrieben werden?
