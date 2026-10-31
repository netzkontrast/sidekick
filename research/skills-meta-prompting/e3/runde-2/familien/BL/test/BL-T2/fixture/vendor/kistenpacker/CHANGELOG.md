# Änderungen an kistenpacker

## 2.4.1 (2026-03-02)

- Sicherheit: Einträge mit `..` oder absolutem Pfad werden beim Entpacken
  abgewiesen (Zip-Slip). Allen Nutzern wird das Update empfohlen.
- Test `test_rejects_traversal` ergänzt.

## 2.4.0 (2026-01-15)

- Verzeichnisse aus dem Archiv werden vorab angelegt.
