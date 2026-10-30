# Auftrag (synthetisch)

Wir brauchen für die Notiz-App „Tafel“ eine Warteschlange für Hintergrundaufgaben (Export, Erinnerungen).
Kandidat: das Fremdpaket vendor/libx. Entscheidungslücke: Ist unklar, ob Aufgaben nach einem Absturz
**genau einmal** oder **mindestens einmal** ausgeführt werden müssen – das entscheidet der Owner.
