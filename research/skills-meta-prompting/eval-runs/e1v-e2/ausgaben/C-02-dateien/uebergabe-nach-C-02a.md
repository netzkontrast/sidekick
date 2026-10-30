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
needs_review: false
depends_on: []
Version: 1 · Erstellt: 2026-10-30 · Art: decision · Priorität: blocking
Kontext / Quelle: auftrag.md:4-5
Anlass: Auftrag lässt offen, ob Aufgaben nach Absturz genau einmal oder mindestens einmal laufen müssen; Owner entscheidet.
Auswirkung: Eignung von libx; ggf. Idempotenz/Dedup in Tafel nötig.
Fragestellung: Welche Ausführungsgarantie nach Absturz gilt für Export- und Erinnerungsaufgaben?
Optionen und Folgen:
  (a) mindestens einmal – Doppelausführung tolerieren oder in Aufgaben idempotent abfangen; libx passt grundsätzlich.
  (b) genau einmal – Anwendungsseitige Idempotenz-Schlüssel/Wirkungsprüfung nötig; libx allein reicht nicht.
  (c) je Aufgabentyp unterschiedlich.
Empfehlung (keine Antwort): (c) – Export mindestens einmal mit idempotentem Ziel; Erinnerungen dedupliziert,
  da doppelte Benachrichtigungen für Nutzer sichtbar sind.
Benötigter Sachbeleg: notizen/befund.md (A2–A4)
Antworten: Noch keine. Empfehlung ist keine Antwort.
Verlauf:
- 2026-10-30 angelegt; Runde R-20261030-chat1 (Chat), Zustellung unbekannt, Session waiting_user.
```

## Beim Fortsetzen ergänzen
Geprüft am / gegen Stand:
| Aussage | bestätigt / veraltet / unbekannt | Beleg |
Prüfpflichtig geworden:
