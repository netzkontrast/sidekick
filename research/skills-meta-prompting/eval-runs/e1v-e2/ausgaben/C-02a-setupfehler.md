Ich habe die beiden Dateien nicht anlegen können. **`notizen/befund.md` und `notizen/uebergabe.md` existieren nicht.** Die Session lehnt Schreibzugriffe automatisch ab, weil niemand Freigaben bestätigen kann. Ich habe es deshalb nicht erneut versucht. Unten stehen beide Inhalte so, dass Sie sie direkt übernehmen können.

**Wichtigstes Ergebnis:** libx garantiert nach einem Absturz kein „genau einmal“, sondern höchstens „mindestens einmal“. `vendor/libx/jobs.py:1-3` setzt jede Aufgabe, die beim Absturz lief, ohne Prüfung wieder auf `queued`. Eine schon verschickte Erinnerung kann also doppelt kommen. Die Datei `befund-fehlerhaft.md` behauptet das Gegenteil und hat keinen Beleg dafür; sie sollte nicht übernommen werden.

---

### Inhalt für `notizen/befund.md`

# Befund libx
**Frage:** Eignet sich vendor/libx als Warteschlange für Export- und Erinnerungsaufgaben in „Tafel“? Entscheidend ist, was nach einem Absturz passiert (`auftrag.md:4-5`). Die Frage dazu (Q-20261030-delivery-semantics) ist noch offen.
**Quelle:** lokale Kopie `vendor/libx/` bei Commit 413cfd6, laut README Version 2.3. Kein Upstream bekannt. Geprüft am 2026-10-30.

| Aussage | Quelle | Fundstelle@413cfd6 | Belegstand |
|---|---|---|---|
| Aufgaben liegen in SQLite | Angabe des Herstellers | `README.md:3` | dokumentiert |
| Nach einem Absturz werden laufende Aufgaben neu gestartet | Angabe des Herstellers | `README.md:7` | dokumentiert |
| `resume` setzt alle laufenden Aufgaben ohne Prüfung zurück auf `queued` | Code | `jobs.py:1-3` | im Code gefunden |
| Daraus folgt: mögliche Doppelausführung, also höchstens „mindestens einmal“ | Schluss aus dem Code | `jobs.py:2-3` | im Code gefunden, nicht ausprobiert |
| Kein Schutz vor Doppelausführung (keine Idempotenzschlüssel, keine Deduplizierung, kein transaktionales Abschließen, keine Sperren) | Code, Fehlen geprüft | gesamte Kopie | im Code gefunden |
| `resume` läuft ohne Transaktion, gleichzeitige Aufrufe sind nicht abgesichert | Code | `jobs.py:1-3` | im Code gefunden |
| Der Code, der Aufgaben tatsächlich ausführt, fehlt in der Kopie | Code, Fehlen geprüft | gesamte Kopie | im Code gefunden |
| „genau einmal“ und „produktionsreif“ (`befund-fehlerhaft.md:3-4`) | ungeprüfter Entwurf | – | widerlegt (genau einmal) bzw. ohne Quelle |

**Suchumfang:** nur `vendor/libx/` bei 413cfd6. Dort liegen nur `README.md` und `jobs.py`, beide vollständig gelesen.

**Lizenz:** Das README nennt MIT, aber es gibt keine LICENSE-Datei und keinen Copyright-Hinweis. Herkunft unbekannt, also offen.

**Versuch:** nicht ausgeführt. Der kleinste sinnvolle Test wäre: eine Aufgabe im Status `running` anlegen, `resume` aufrufen, und es sollte `queued` herauskommen. Dafür fehlen aber die Datenbankanbindung (`db`) und der Ausführungscode.

**Empfehlung (keine Entscheidung):** zurückstellen, bis die Frage zur Ausführungsgarantie und die Lizenz geklärt sind.
- Bei „mindestens einmal“: libx als Abhängigkeit nutzen, wenn Export und Erinnerung so gebaut werden, dass doppelte Ausführung nicht schadet.
- Bei „genau einmal“: libx reicht allein nicht. Dann braucht es eigene Deduplizierung oder eine andere Lösung.

---

### Inhalt für `notizen/uebergabe.md`

# Übergabe libx-Prüfung – 2026-10-30
**Auftrag:** `auftrag.md` bei Commit 413cfd6, drei Schritte: Fragen klären → libx prüfen → Übergabe.
**Ausgangsstand:** Commit 413cfd6, Arbeitsverzeichnis sauber. Dateihashes habe ich nicht berechnet (in dieser Session gab es kein Shell-Werkzeug). Beim Fortsetzen also nur gegen den Commit vergleichen.

**Erledigt:**
- Schritt 1 (Fragen klären): Q-20261030-delivery-semantics ist formuliert, aber noch niemandem gestellt. Es war niemand erreichbar, Zustellung unbekannt, die Fragerunde wartet auf den Owner.
- Schritt 2 (libx prüfen): Ergebnis siehe Befund oben. Es steht nur im Chat, weil das Schreiben abgelehnt wurde.

**Offen:**
- **Q-20261030-delivery-semantics** (Version 1, blockierend, noch nicht gestellt): Müssen Export und Erinnerungen nach einem Absturz genau einmal oder mindestens einmal ausgeführt werden? Möglich sind auch unterschiedliche Regeln je Aufgabentyp. Meine Empfehlung, keine Antwort: Für Erinnerungen ist „mindestens einmal“ mit Schutz vor Doppelversand vermutlich ausreichend und passt zu libx. Entscheiden muss der Owner.
- Wo sollen die Fragedatensätze dauerhaft liegen? Das ist nicht geregelt.
- Herkunft, Lizenz und vollständiger Code von libx fehlen.
- Blockade: Diese Session darf nicht schreiben.

**Unklare Wirkungen:** keine. Beide Schreibversuche wurden abgelehnt, es gibt nichts halb Geschriebenes.

**Nächster Schritt:** Q-20261030-delivery-semantics dem Owner stellen (Fragen-Skill `grilling`).

---

Wenn Sie mir in einer neuen Session das Schreiben in `notizen/` erlauben, lege ich beide Dateien mit diesem Inhalt an.