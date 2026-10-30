# Ausfallmatrix

| Fall-ID | Anforderungs-ID | Störungsklasse | Injektionspunkt | Soll Zustellung | Soll Lauf | Soll Wirkung | Umgebung | Assertion | Rohbelegort | Status |
|---|---|---|---|---|---|---|---|---|---|---|

**Störungsklassen:** Duplikat · Umordnung · Verlust der Anfrage · Verlust der Antwort · veraltete Identität (Epoch) · Widerruf · Partition · Prozessabsturz · Neustart eines Vermittlers · nebenläufige Änderung.

**Injektionspunkte:** vor/nach Zusage · vor/nach Wirkung · vor/nach Bestätigung.

**Umgebungen, schwächste zuerst:** In-Process-Fake · isolierte Umgebung mit eigenen Test-Zugangsdaten · freigegebenes Testziel. Produktive Systeme nur mit Freigabe für genau diese Aktion.

**Status:** bestanden · fehlgeschlagen · blockiert · nicht ausgeführt. Fehlende Belege heißen „nicht beobachtbar“, nie „bestanden“.
