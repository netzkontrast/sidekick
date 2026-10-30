# Mini-Spec Auftragsdienst (synthetisch)

- S-1: Jeder Befehl trägt einen Idempotenz-Schlüssel. Ein zweiter Befehl mit demselben Schlüssel erzeugt keinen zweiten Effekt.
- S-2: Ein Effekt (z. B. „Datei im Speicher ablegen“) wird erst als Absicht protokolliert, dann ausgeführt, dann bestätigt.
- S-3: Testumgebung: Fake-Effektdienst im Prozess; kein Zugang zu Produktivsystemen.
