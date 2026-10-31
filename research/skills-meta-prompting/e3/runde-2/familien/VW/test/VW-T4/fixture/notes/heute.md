# Notizen 2026-10-31

- 13:05 Runner-Profil auf 4 vCPU umgestellt (c3), damit die Testsuite
  schneller durchläuft: jetzt 6 statt 14 min.
- 13:40 Versuch: Berichte nur für Kunden neu erzeugen, deren Daten sich
  seit dem letzten Lauf geändert haben. tests/summen.test.js wurde rot:
  Die Summenseite braucht die Zahlen aller Kunden, die Gesamtsumme war 0.
  Änderung verworfen (git restore), nichts committet.
- 14:30 Berichtsjob gemessen: 41 min (Ziel: unter 15 min).
- 14:45 Schluss für heute.
