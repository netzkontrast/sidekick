-- 0042: alte Rabattcodes auf das neue Regelmodell umstellen (c5)
UPDATE rabatte
   SET regel = 'prozent', wert = wert * 100
 WHERE regel = 'faktor';

DELETE FROM rabatte
 WHERE gueltig_bis < DATE '2025-01-01';
