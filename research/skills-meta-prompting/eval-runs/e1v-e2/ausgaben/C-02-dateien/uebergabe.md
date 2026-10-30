# Übergabe libx-Prüfung für „Tafel“ – 2026-10-30

Ziel / Auftragsbezug + Version: `auftrag.md` (Stand Commit ac1af94) – Warteschlange für Hintergrundaufgaben (Export, Erinnerungen) in „Tafel“;
Kandidat vendor/libx. Gesteuerte Schritte laut Nutzer: (1) Grilling, (2) Recherche vendor/libx → notizen/befund.md, (3) diese Übergabe.

Ausgangsstand (Schnappschuss, 2026-10-30):
- Commit: ac1af94 („c1“), Arbeitsbaum vor dieser Session sauber.
- Gelesene Artefakte (unverändert, im Commit ac1af94): `auftrag.md`, `vendor/libx/README.md`, `vendor/libx/jobs.py`, `befund-fehlerhaft.md`.
  Datei-Hashes nicht berechnet (kein Shell-Werkzeug in der Session); beim Fortsetzen per `git diff ac1af94 -- <pfad>` abgleichen.
- Neu angelegt, nicht committet: `notizen/befund.md`, `notizen/uebergabe.md`.
- Fragenstand: Q-20261030-delivery-semantics `open` (Zustellung unbekannt). Keine Entscheidungen getroffen.

Erledigt (Ergebnis → Beleg):
- Schritt 1 Grilling: Frage erfasst und im Chat gestellt (Runde R-20261030-chat1), niemand erreichbar → Session `waiting_user`.
  Es gibt keine Fragenablage im Projekt (keine CLAUDE.md/AGENTS.md); daher ist der Datensatz unten die einzige Ablage.
- Schritt 2 Recherche → `notizen/befund.md`. Kern: `jobs.py:1-3` stellt nach Absturz alle `running`-Jobs wieder auf `queued`
  → höchstens „mindestens einmal“, kein „genau einmal“; keine Idempotenz/Dedup im Paket; Lizenz MIT nur laut README, keine LICENSE-Datei.
  Empfehlungskategorie: zurückstellen bis Owner-Antwort.
- `befund-fehlerhaft.md` widerspricht dem Code („genau einmal“) und enthält unbelegte Aussagen – nicht verwenden, nicht verändert.

Offen:
- Fragen-IDs: Q-20261030-delivery-semantics (blocking).
- Frage an Nutzer: dauerhafter Ablageort für Grilling-Fragen (nicht festgelegt; kein Ordner erfunden).
- Annahmen: keine als Antwort übernommen. Ableitung A3 im Befund (Doppelausführung) ist im Code gefunden, nicht praktisch nachgewiesen.
- Blockaden: Owner-Antwort fehlt; libx-Worker/DB-Schicht und LICENSE-Text fehlen im Paket, daher kein Reproduktionsversuch möglich.

Unklare Wirkungen (begonnen, ohne Abschlussbeleg):
- Zustellung der Frage Q-20261030-delivery-semantics an den Owner: unbekannt (kein Rückkanal). Nicht automatisch erneut als „gestellt“ werten.

Nächster Schritt (genau einer) + passender Ablauf:
- Owner-Antwort auf Q-20261030-delivery-semantics einholen – Ablauf: Skill `grilling` (Antwort mit Quelle erfassen), danach Befund-Empfehlung neu bewerten.

## Fragedatensatz (einzige Ablage)

```
id: Q-20261030-delivery-semantics
status: open
needs_review: true
depends_on: []
Version: 2 · Erstellt: 2026-10-30 · Geändert: 2026-10-30 (libx 2.4, bd9f111) · Art: decision · Priorität: blocking
Kontext / Quelle: auftrag.md:4-5
Anlass: Auftrag lässt offen, ob Aufgaben nach Absturz genau einmal oder mindestens einmal laufen müssen; Owner entscheidet.
Auswirkung: Eignung von libx; ggf. Idempotenz/Dedup in Tafel nötig.
Fragestellung: Welche Ausführungsgarantie nach Absturz gilt für Export- und Erinnerungsaufgaben?
Optionen und Folgen (Stand libx 2.4: nach Absturz kein Neustart, Jobs werden `unclear`, Tafel muss abgleichen):
  (a) mindestens einmal – Tafel startet `unclear`-Jobs selbst neu; Aufgaben idempotent halten oder Doppelausführung tolerieren.
  (b) genau einmal – Tafel muss je `unclear`-Job prüfen, ob die Wirkung (Export-Datei, versandte Erinnerung) schon eingetreten ist;
      dafür Wirkungsbeleg/Idempotenz-Schlüssel nötig. libx 2.4 liefert die Markierung, nicht die Prüfung.
  (c) je Aufgabentyp unterschiedlich.
Empfehlung (keine Antwort): (c) – Export: `unclear` einfach neu starten (idempotentes Ziel); Erinnerungen: vor Neustart
  Versandnachweis prüfen, da doppelte Benachrichtigungen für Nutzer sichtbar sind.
Benötigter Sachbeleg: notizen/befund.md (A2–A4, Nachtrag libx 2.4)
Antworten: Noch keine. Empfehlung ist keine Antwort.
Verlauf:
- 2026-10-30 angelegt; Runde R-20261030-chat1 (Chat), Zustellung unbekannt, Session waiting_user.
- 2026-10-30 Version 2: Optionen/Empfehlung an libx 2.4 angepasst (bd9f111); Version 1 gilt als überholt, needs_review bis erneut vorgelegt.
```

## Fortsetzung 2026-10-30 (Session 2)
Geprüft gegen Stand: Commit bd9f111 („c3: libx 2.4“), Arbeitsbaum sauber. Seit ac1af94: 35c0d82 („c2: Stand nach Session 1“), bd9f111.
Abgleich per Dateiinhalt; Hashes/`git diff` erneut nicht berechenbar (kein Shell-Werkzeug).

| Aussage | Status | Beleg |
|---|---|---|
| libx-Version 2.3 | veraltet | README.md:1@bd9f111: „libx 2.4“ |
| A1 SQLite-Speicherung | bestätigt (nur dokumentiert) | README.md:3@bd9f111 |
| A2 `resume()` setzt `running` → `queued` | veraltet | jobs.py:2-3@bd9f111: setzt `running` → `unclear` |
| A3 Semantik „mindestens einmal“ durch Neustart | veraltet | kein automatischer Neustart mehr; Anwendung muss `unclear` abgleichen (README.md:3-4) |
| A4 keine Idempotenz/Dedup/Fencing | bestätigt | jobs.py@bd9f111 (3 Zeilen) – weiterhin nichts davon |
| A5 Lizenz MIT nur laut README, keine LICENSE | bestätigt | README.md:5@bd9f111; `vendor/libx/**` = 2 Dateien |
| A6 Worker/DB-Schicht fehlen | bestätigt | wie A5 |
| `befund-fehlerhaft.md` unbrauchbar | bestätigt | Inhalt unverändert; „genau einmal“ widerspricht auch 2.4 |
| Q-20261030-delivery-semantics `open`, keine Antwort | bestätigt | keine Antwort im Repo oder Chat |
| Zustellung der Frage an Owner | unbekannt | kein Rückkanal |
| Neuer Widerspruch: README nennt Status `unklar`, Code `unclear` | neu | README.md:4 vs. jobs.py:3 – vermutlich nur Übersetzung, nicht geprüft |

Prüfpflichtig geworden:
- `notizen/befund.md` A2, A3, Ausfallverhalten, Schlussfolgerung, Versuch, Empfehlung → in Session 2 auf 2.4 nachgeführt (siehe Befund, Abschnitt „Nachtrag libx 2.4“).
- Fragedatensatz Q-20261030-delivery-semantics: Optionen/Folgen und Empfehlung bezogen sich auf 2.3 → auf Version 2 gehoben, `needs_review: true` bis Owner die geänderte Fassung gesehen hat.

Nächster Schritt (genau einer, ersetzt den obigen): Owner die überarbeitete Frage Q-20261030-delivery-semantics (Version 2) vorlegen – Ablauf: Skill `grilling`.
