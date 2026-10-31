-- 0017: Währung für Bestellungen, Schritt 1 von 3 (c5)
ALTER TABLE bestellungen ADD COLUMN waehrung text;

-- Schritt 2 (manuell, in Blöcken zu 5000 Zeilen, ab der letzten ID):
-- UPDATE bestellungen SET waehrung = 'EUR'
--  WHERE id > :letzte_id AND id <= :letzte_id + 5000 AND waehrung IS NULL;

-- Schritt 3: Migration 0018 setzt NOT NULL, sobald keine NULL-Werte mehr da sind.
