# Gesamtplan ab November 2026: vom Entwurf zum ersten vertikalen MVP

> Entwurf vom 31.10.2026 · **Vorschlag zur Owner-Entscheidung.** Grundlage: [Plan-Review](plan-review-2026-10-31.md), [Analyse §9](../../../docs/analyse-und-uebernahmeplan.md#9-umfang-und-reihenfolge),
> [Bauauftrag v5](../../../docs/claude-startauftrag-vision-v5.md), [V0-Spec](../../../docs/spec/v0-ziel-und-vertraege.md), [Runtime-Adapter-Spec](../../../docs/spec/runtime-adapter-v0.md).
> Status führt weiter nur der [PLAN](PLAN.md) (Hub) bzw. der [Library-Plan](../../skills-meta-prompting/library-research-plan.md). Dieser Plan legt Reihenfolge, Meilensteine und Abnahmen fest
> und ersetzt die verstreuten Reihenfolgen aus AP, RS, N, D und V durch eine (Zuordnung in §6).

## 1. Ziel und Nicht-Ziele

**Ziel:** Der erste vertikale MVP aus Analyse §9: ein Owner, ein Projekt, ein Gerät, Auftragstyp `code-change`, Claude Code als Runtime, Review als eigener Run, menschliche Abnahme, PR als einziger externer Effekt.
Davor müssen die Tore A–D entschieden sein, mit Belegen statt Tabellen.

**Nicht-Ziele bis zum MVP:** weitere Runtimes, Sprache, Offline-Frontend (V2), Gedächtnis (V5), Proaktivität (V6), A2A, Python-Optimierungswerkstatt (D2–D7), eigener Agent-Loop, MUXI-artige Runtime.

## 2. Die zentrale Änderung gegenüber den bisherigen Plänen

Bisher sollte Tor A durch einen Vergleich von Paperclip und OpenHands entschieden werden, und erst danach sollte V1 den Kern bauen.
Neu: **Zuerst wird eine ausführbare Vertragssuite gebaut.** Sie ist ein Blackbox-Test gegen zwei Schnittstellen: einen Kern-Port (Domain-Commands und Journal) und einen Runtime-Port (Adapterprofil).
Dieselbe Suite läuft dann

1. gegen einen bewusst kleinen, wegwerfbaren Referenzkern,
2. gegen Paperclip bzw. OpenHands, soweit deren öffentliche Schnittstellen das erlauben,
3. später gegen den echten Kern aus Phase 1.

Damit wird Tor A messbar: Ein Kandidat erfüllt Fall X oder nicht. Die Specs werden ausführbar (Plan-Review K2), und kein Testaufwand ist verloren, egal wie Tor A ausgeht.

## 3. Meilensteine

Reihenfolge nach Abhängigkeiten. Zeitangaben sind Zeitboxen, keine Zusagen. Innerhalb eines Meilensteins sind die mit ∥ markierten Pakete parallel möglich.

### M0 – Planungshygiene (31.10.2026, erledigt bis auf die Owner-Entscheidung)

| Paket | Ergebnis | Status |
|---|---|---|
| M0.1 | Plan-Review mit Kritik K1–K10 | geliefert (#37) |
| M0.2 | N1: DSPy-Dossier auf `92d97ca`, RS-1 in der Adapter-Spec (RTA-INV-07, -AUF-07, -LEB-09) | geliefert (#37) |
| M0.3 | Dieser Gesamtplan | Entwurf |
| M0.4 | Owner-Entscheidungen aus §5 | offen |

### M1 – Ausführbare Verträge (kostenfrei, Zeitbox 3 Tage)

**M1.1 Kern-Port und Runtime-Port festlegen.**
- Ziel: zwei kleine, schriftlich fixierte Schnittstellen, gegen die Tests laufen. Der Kern-Port umfasst die Commands aus V0 (Auftrag anlegen/freigeben, Claim, Rückfrage, Einreichen, Effekt vorschlagen/freigeben, Abbruch) und das Lesen des Journals. Der Runtime-Port ist das Adapterprofil.
- Eingaben: V0-Spec §2–§6, Runtime-Adapter-Spec.
- Artefakt: Spec-Ergänzung `docs/spec/` (Kern-Port als Command-Liste mit Ein- und Ausgaben); kein Framework, kein Transport.
- Abnahme: Jeder Schritt von V0-ABL-01 und jeder V0-FALL nennt die Commands, die er braucht.

**M1.2 Fake-Runtime (∥ M1.3).**
- Ziel: deterministisches Programm mit steuerbarem Verhalten: Ausgabe, Session-ID, Rückfrage, Exit-Code, Hängen, Kindprozess, Kostenzeile.
- Artefakt: Skript plus Profil unter `tools/` oder `research/` (Owner-Entscheidung, §5).
- Abnahme: Profil validiert gegen das Schema; Verhalten über Argumente oder Umgebungsvariablen steuerbar.

**M1.3 Vertragssuite.**
- Ziel: V0-ABL-01, V0-FALL-01…38 und RTA-FALL-01…51 als Tests gegen die Ports, Node ohne Dependencies.
- Abnahme: Jede ID ist entweder ein Test oder steht mit Grund auf „nicht automatisierbar“. Ohne Implementierung sind alle Tests rot (Nachweis, dass sie etwas prüfen).

**M1.4 Referenzkern, wegwerfbar.**
- Ziel: kleinste Implementierung des Kern-Ports im Speicher, mit Journal, Claim/Epoch, Idempotenz-Key, Freigabebindung und Fake-Effekt `artifact.store`; dazu ein Supervisor nach der Adapter-Spec.
- Abnahme: V0-ABL-01 läuft automatisiert grün; Zahl der grünen, roten und offenen Fälle steht im Bericht.
- Grenzen: in-memory, ein Prozess, kein Netz. Der Referenzkern ist ausdrücklich **kein** Vorgriff auf Tor A und wird nach M4 nicht weitergepflegt.
- Zustand und Rechte: nur Testverzeichnisse; keine Credentials; Fake-Effekte schreiben nur in ein temporäres Verzeichnis.

**M1.5 CodeGraph-Index trennen** (N7; vor M1.3, wegen Clean-Room). Eigener Index für sidekick oder Ausschluss der Fremdklone; Entscheidung beim Owner.

### M2 – Tor B und Tor A mit Belegen (Budget nötig, Zeitbox 3–4 Tage)

**M2.1 Tor B, CLI-Pfad (∥ M2.2).** Wie N2 im Plan-Review: höchstens 12 Starts, Deckel 3 USD im Ledger. Zusätzlich: Das echte Claude-Code-Profil läuft durch die RTA-Fälle der Suite, die ohne Fake gehen (Session, Abbruch, Kosten, Rechtemodus).
- Abnahme: Tor-B-Matrix, Spalte „Strukturierte CLI“, vollständig mit Belegstatus; Profilfähigkeiten mit Beleg auf `nachgewiesen` oder begründet `nicht_unterstuetzt`.

**M2.2 Tor B, ACP und Agent SDK.** Dieselben Fälle über Claude ACP bzw. das SDK, sofern ohne Abo-Token-Extraktion zulässig. Wenn nicht zulässig oder nicht installierbar: begründet `offen`.

**M2.3 Tor A mit der Vertragssuite.**
- Ziel: Paperclip und OpenHands lokal starten (Docker vorhanden) und je einen dünnen Adapter vom Kern-Port auf ihre öffentliche API bauen, soweit möglich.
- Abnahme: Für jeden Kandidaten steht je Fall „erfüllt / nicht erfüllt / nicht abbildbar“. Die harten Ausschlüsse aus Analyse §6 sind ausdrücklich geprüft: Außenwirkung trotz kontrolliertem Run, unklarer Zustand nach Neustart, fehlender Export, invasive Kernumbauten.
- Entscheidungsregel: Ein Kandidat kommt nur weiter, wenn er die Fälle zu Claim/Epoch, Freigabebindung und `outcome_unknown` erfüllt oder mit einem Erweiterungspunkt erfüllbar macht. Sonst eigener Kern.
- Ergebnis: Protokolle in `docs/entscheidungen/tor-a-…` und `tor-b-…` auf `entschieden` oder `weiterer Spike nötig`.

### M3 – Tor C und Tor D (Zeitbox 2 Tage)

**M3.1 Lokale Outbox und Transportprobe.** Die Suite läuft mit Prozessgrenze zwischen Connector und Kern: HTTPS-Polling plus SSE, Netz trennen, Connector neu starten, Kern neu starten (V0-FALL-03, -04, -11).
**M3.2 Workflow und Speicher.** Höchstens zwei Kandidaten aus Tor D gegen die Neustart- und Wartefälle der Suite.
- Abnahme: Tor C und Tor D entschieden; die Fälle zu Zustellung und Neustart sind grün oder begründet offen.

### M4 – V1-Spec und Phase-1-Start

**M4.1 Review-Schulden abtragen.** Owner-Review von V0, Runtime-Adapter V0 und der Kern-Port-Ergänzung; Status von „Entwurf“ auf „abgenommen“ oder mit Änderungen.
**M4.2 Stack festlegen** (O-4): Sprache, Framework, Datenbank auf Basis von Tor A, C, D.
**M4.3 Vertikaler MVP**, Abnahme nach Analyse §8 und §9: Auftrag → Claude → Diff → Checks → Review-Run → Abnahme → PR. Dazu Browser-Reload und Netzverlust. Die Suite aus M1 ist der Regressionstest.

## 4. Skill-Library parallel, aber nachrangig

| Paket | Bedingung | Kosten |
|---|---|---|
| L1 – Spielraum-Vorprüfung grilling (N5) | jederzeit | keine |
| L2 – AP4 als Fallfamilie ohne Läufe (N6) | jederzeit | keine |
| L3 – B1 neu einfrieren mit neun Paketen (K9) | vor jedem E-Lauf | keine |
| L4 – Kostendeckel je Modellaufruf (SLV0-EVAL-49 ff.) | vor jedem Lauf mit Reflexion oder Judge | keine |
| L5 – D2–D4 (DSPy/GEPA-Pilot) | L1 zeigt Spielraum **und** Owner gibt Dependencies und Budget frei | bis 65 USD laut #33 |
| L6 – Kontextpakete der Library im Run-Start (`eval context-pack` → Kern-Port) | nach M4.2 | keine |

L6 verbindet beide Stränge: Ein Run bekommt sein Kontextpaket aus der Library über denselben Kern-Port. Das ist der Punkt, an dem die Library-Arbeit dem Produkt direkt nützt.

## 5. Entscheidungen des Owners

| Nr. | Frage | Wann gebraucht | Vorschlag |
|---|---|---|---|
| E1 | Gilt „Kern vor Library“ und dieser Gesamtplan? | jetzt | ja |
| E2 | Ablage für Fake-Runtime, Suite und Referenzkern | vor M1.2 | **umgesetzt:** alles unter `tools/contract-suite/`, Referenzkern in `referenzkern/` als wegwerfbar markiert; `research/` scheidet aus, weil es nach Owner-Entscheidung vom 30.10.2026 außerhalb von Test- und Buildpfaden bleibt |
| E3 | Eigener CodeGraph-Index für sidekick | vor M1.3 | **entschieden** (Owner, 31.10.2026): Index angelegt; ohne Watcher, daher nach Änderungen `codegraph sync` |
| E4 | Budget M2.1 (≤ 12 Starts, ≤ 3 USD) und zulässiger CLI-Zugang | vor M2.1 | freigeben |
| E5 | Docker-Läufe von Paperclip und OpenHands mit Netz | vor M2.3 | freigeben, Zeitbox 2 Tage |
| E6 | Dependencies und Budget für L5 | erst nach L1 | zurückstellen |

## 6. Zuordnung der bisherigen Pakete

| Bisher | Neu | Bemerkung |
|---|---|---|
| AP1–AP3 | erledigt | #31, #32, #34 |
| AP4 | L2 | ohne Läufe |
| AP5 | M4.1/M4.3 | Kontext- und Grant-Bausteine gehören in die V1-Spec |
| RS-1 | M0.2 | erledigt |
| RS-2 | M1.2–M1.4 | Fake-Runtime und Suite |
| RS-3 | M2.1 | |
| RS-4 | M4.3 | Supervisor im echten Stack |
| N1 | M0.2 | erledigt |
| N2 | M2.1 | |
| N3 | M1.2–M1.4 | |
| N4 | M2.3 | jetzt mit der Suite statt freiem Spike |
| N5, N6 | L1, L2 | |
| N7 | M1.5 | |
| D0, D1 | L1, L4 | Dossier-Update erledigt (M0.2) |
| D2–D7 | L5 und später | |
| V1 | M1 + M4 | Contract-Tests vorgezogen |
| V2–V6, N0 | nach dem MVP | unverändert |
| Tor A–D | M2, M3 | |

## 7. Kritik am eigenen Plan

- **Gefahr der Vorentscheidung.** Wer einen Referenzkern baut, will ihn behalten. Gegenmittel: Zeitbox, Ablage unter `research/`, ausdrücklich wegwerfbar, und die Entscheidungsregel in M2.3 hängt an Fällen, nicht am Aufwand.
- **Adapter auf Fremdsysteme können scheitern,** weil Paperclip oder OpenHands keine Epoch- oder Freigabesemantik nach außen zeigen. Dann ist „nicht abbildbar“ selbst der Befund für Tor A, kein Fehler des Plans.
- **Node-Suite gegen späteren TypeScript-Stack:** Die Suite prüft über Ports und ist damit sprachunabhängig, solange die Ports als Prozess- oder HTTP-Grenze definiert sind. Das ist in M1.1 festzulegen.
- **Reichweite von M1.3:** 38 V0-Fälle und 51 RTA-Fälle sind viel für drei Tage. Priorität haben V0-ABL-01, die Fälle aus dessen Abnahme (V0-FALL-01, -02, -06, -07, -12, -14) und RTA-FALL-01…31. Der Rest darf als offen in den Bericht.
- **Abhängigkeit vom Owner:** E2–E5 blockieren M1.2 bis M2.3. Ohne Antwort läuft nur M1.1 weiter.

## 8. Nächster ausführbarer Schritt

M1.1 – Kern-Port als Spec-Ergänzung. Er braucht keine Entscheidung, kostet nichts und ist Voraussetzung für alles in M1.
