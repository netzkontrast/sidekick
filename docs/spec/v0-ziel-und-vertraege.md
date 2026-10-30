# V0 – Ziel und Verträge

> Version 0.1 · 30.10.2026 · **Entwurf zur Review**, kein Implementierungsbeginn.
> Grundlage: [Vision v5 (Entwurf)](../vision-v5-entwurf.md), [Kern-These](../../research/kern-first-principles.md),
> [Vision v4](../vision.md) §9–13, [Analyse](../analyse-und-uebernahmeplan.md) §3 und §8, [Bauauftrag](../claude-startauftrag-vision-v5.md).
> Vorentscheidungen: [Fragen V0](../fragen/v0-ziel-und-vertraege/index.md), alle drei mit Option A beantwortet.
> Diese Spec legt kein Framework, keine Datenbank, keinen Transport und keine Dependency fest. Das bleibt Sache der Tore A–D.

## 1. Ziel und Umfang

**Produktziel** ([A-20261030-v0-produktziel](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-produktziel.md)):
Sidekick hält Vorhaben über Geräte, Modelle und Unterbrechungen zusammen. Verlässlich wird das durch den Kern
aus **Vertrag, Journal und Tor**.

**Umfang dieser Spec:**
- gemeinsame Begriffe,
- Invarianten des Kerns,
- Zustandsautomaten mit Autorität und Beispiel für jeden Zustand,
- Fallmatrix für Duplikate, Offline, Widerruf und unklare Ausgänge,
- der erste durchgängige Ablauf als Abnahmeszenario,
- Schemas für Auftrag, Effekt, Gerät, Erinnerung und Journal-Ereignis.

**Vorgesehen, aber nicht gebaut** ([A-20261030-v0-lokal-offline](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-lokal-offline.md)):
lokale Inferenz als Gerätefähigkeit und ein statisches Offline-Frontend mit lokalen Entwürfen.
Beide sind in den Verträgen modelliert. Gebaut werden sie ab V2 (Offline) bzw. V4 (lokale Runtime).

**Erster Auftragstyp** ([A-20261030-v0-erster-auftrag](../fragen/v0-ziel-und-vertraege/questions/Q-20261030-v0-erster-auftrag.md)):
`research-report` mit prüfbarem Artefakt. Damit weicht V0 bewusst von [Analyse §9](../analyse-und-uebernahmeplan.md#9-umfang-und-reihenfolge) ab,
die `code-change` als MVP nennt. `code-change` bleibt Nordstern und Testauftrag für [Tor A](../entscheidungen/tor-a-erweiterung-oder-eigener-kern.md).

**Nicht in V0:** Sprache, Proaktivität (V6), Needle-Training (N0), Wettbewerbs-Runs, Delegation (L3+),
Mehrbenutzerbetrieb, Playbook-Engine. Die Schemas lassen dafür Erweiterungspunkte, regeln sie aber nicht.

## 2. Begriffe

| Begriff | Bedeutung in dieser Spec |
|---|---|
| **Vorhaben** | Langfristiges Anliegen des Owners. Bündelt Aufträge, Erinnerungen und Entscheidungen. In V0 nur Referenz-ID mit Titel und Status `aktiv`/`ruhend`/`abgeschlossen`. |
| **Auftrag** | Versionierter Vertrag über eine abgrenzbare Arbeit: Ziel, Abnahmekriterien, Befugnis, Budget, Datenklasse. |
| **Schritt** | Teil eines Auftrags mit eigenem Bearbeiter. V0 hat genau einen Arbeitsschritt plus Abnahme. |
| **Run** | Ein Ausführungsversuch eines Schritts durch eine Runtime auf einem Gerät. |
| **Claim** | Zuordnung eines Schritts zu genau einem Run. Trägt eine **Epoch**, die bei jeder Neuvergabe steigt. |
| **Effekt** | Typisierte Wirkung außerhalb des Kerns, z. B. Artefakt übernehmen oder PR öffnen. |
| **Freigabe** | Entscheidung über genau einen Effekt, gebunden an Effekttyp, kanonische Parameter, Hash, Ziel, Auftragsversion und Epoch. |
| **Rückfrage** | Strukturierte Bitte um menschlichen Input mit Optionen und Standardverhalten. |
| **Journal** | Append-only Folge von Ereignissen je Auftrag. Zustände sind daraus abgeleitet. |
| **Gerät** | Gepairter Rechner oder Browser mit eigener Identität. Ein Gerät mit Connector kann Runs ausführen. |
| **Capability** | Vom Gerät gemeldete oder nachgewiesene Fähigkeit, z. B. Runtime oder lokales Modell, mit Version und Zeitstempel. |
| **Episode** | Beobachtete Aufzeichnung aus einer Session mit Herkunft und Datenklasse. |
| **Erinnerung** | Aus Episoden vorgeschlagenes, vom Owner bestätigtes, korrigierbares Wissen mit Quellen. |
| **Entwurf** | Lokal auf einem Gerät erstellter, noch nicht vom Hub bestätigter Inhalt. |

„Bestätigt“ heißt in dieser Spec immer: vom Hub transaktional ins Journal geschrieben und per ACK quittiert.
Eine Empfangsbestätigung, ein gültiger Claim, ein gestarteter Run und ein ausgeführter Effekt sind vier verschiedene Tatsachen.

## 3. Invarianten

| ID | Invariante | Herkunft |
|---|---|---|
| V0-INV-01 | Nichts wird ausgeführt ohne gültigen Auftrag in einer bestimmten Version. Rechte entstehen nur aus Grants der Befugnis. | Kern I1 |
| V0-INV-02 | Nur der Kern schreibt ins Journal. Zustände, Kosten und Belege werden daraus abgeleitet. | Kern I2, §6 |
| V0-INV-03 | Ein unklarer Ausgang wird als `outcome_unknown` im Journal geführt. Er wird nie still als Erfolg oder Fehlschlag behandelt. | Kern I2, v4 §9.3 |
| V0-INV-04 | Jeder Effekt passiert eine Freigabe. Ändern sich Parameter, Ziel, Auftragsversion oder Epoch, ist die Freigabe ungültig. | Kern I3, Analyse §3 |
| V0-INV-05 | Pro Schritt gibt es höchstens einen aktiven Claim. Einreichungen und Effekte mit veralteter Epoch werden abgewiesen, auch unmittelbar am Effekt. | Analyse §3 „Fencing“ |
| V0-INV-06 | Jeder Command trägt einen Idempotenz-Key. Eine identische Wiederholung liefert dasselbe Ergebnis und erzeugt kein zweites Ereignis. | v4 §9.3 |
| V0-INV-07 | Modellausgaben, ASR-Texte und Agent-Berichte sind Vorschläge. Sie erteilen weder Rechte noch Freigaben. | Vision v5 „Agent First“ |
| V0-INV-08 | Presence ist kein Beweis für einen laufenden Prozess. Zustände von Run und Verbindung werden getrennt geführt. | v4 §9.2, Machbarkeit |
| V0-INV-09 | `local-only`-Inhalte verlassen das Gerät nicht, auch nicht über Relay, Push, Logs oder Hub-Assistenz. Der Hub sieht davon höchstens freigegebene Metadaten. | Analyse §3, v5 „offline first“ |
| V0-INV-10 | Erinnerungen ohne Quelle sind nicht zulässig. Widerrufene Erinnerungen erscheinen in keinem neu gepackten Kontext. | Machbarkeit „Speicher, Vergessen“ |
| V0-INV-11 | Journal-Ereignisse enthalten minimierten Inhalt. Sensible Inhalte liegen in gesondert löschbaren Objekten und werden per Referenz eingebunden. | Machbarkeit „Speicher, Vergessen“ |

Die Spec garantiert nichts über „genau einmal“ hinaus, was ein externer Dienst nicht unterstützt (v4 §9.3 „Grenze“).
Für Effekte ohne Idempotenzunterstützung gilt: höchstens ein Versuch ohne neue Freigabe; danach Abgleich.

## 4. Zustandsautomaten

Autorität bezeichnet, wer einen Übergang auslösen darf. „Kern“ heißt: deterministisch durch den Hub aufgrund von Ereignissen.
Kein Übergang darf von einer Rolle ausgelöst werden, die hier nicht genannt ist.

### 4.1 Auftrag (V0-AUF)

Übernimmt die Zustände aus [v4 §9.2](../vision.md#92-drei-getrennte-zustandsautomaten). V0 nutzt die folgende Teilmenge.
`checking`, `in_review`, `applying` und `rework` sind reserviert, aber im ersten Ablauf nicht erreichbar, bis auf `applying` für den Übernahme-Effekt.

| ID | Zustand | Bedeutung | Übergang hinein, Autorität | Beispiel |
|---|---|---|---|---|
| V0-AUF-01 | `draft` | Vertrag wird erfasst, noch nicht zur Arbeit freigegeben | Owner erstellt; auch offline als Entwurf (§4.7) | Owner tippt „Vergleiche drei Ansätze für X“ und speichert. |
| V0-AUF-02 | `open` | Version festgeschrieben, wartet auf Claim | Owner gibt frei | Owner bestätigt Ziel, Kriterien, Budget 30 min, Datenklasse `internal`. |
| V0-AUF-03 | `in_progress` | Ein Run hält einen gültigen Claim | Kern, nach erfolgreichem Claim | Connector auf `pc-heim` erhält Claim mit Epoch 1. |
| V0-AUF-04 | `waiting_input` | Offene Rückfrage blockiert den Schritt | Run stellt Rückfrage; Kern überführt | Run fragt: „Quellen nur deutschsprachig?“ |
| V0-AUF-05 | `submitted` | Artefakt eingereicht, Abnahme steht aus | Run mit aktueller Epoch reicht ein | Run reicht `bericht.md` mit Hash und drei Quellenbelegen ein. |
| V0-AUF-06 | `accepted` | Owner hat Kriterien als erfüllt bestätigt | Nur Owner (V0); nie der Bearbeiter selbst | Owner hakt alle Kriterien ab und nimmt ab. |
| V0-AUF-07 | `waiting_approval` | Übernahme-Effekt wartet auf Freigabe | Kern, wenn Policy Freigabe verlangt | Effekt `artifact.store` in Vorhaben-Ablage wartet. |
| V0-AUF-08 | `applying` | Freigegebener Effekt wird ausgeführt | Kern, nach gültiger Freigabe | Effekt-Dienst schreibt das Artefakt. |
| V0-AUF-09 | `completed` | Übernahme bestätigt | Kern, nach `effect_done` | Artefakt liegt in der Ablage, Hash stimmt. |
| V0-AUF-10 | `outcome_unknown` | Effekt-Antwort fehlt, Wirkung unklar | Kern, bei Intent ohne Ergebnis | Verbindung reißt nach Senden ab; Abgleich läuft. |
| V0-AUF-11 | `cancelled` | Owner hat abgebrochen | Owner; Run-Ende wird getrennt bestätigt (§4.2) | Owner bricht ab, Run steht auf `cancel_requested`. |
| V0-AUF-12 | `failed` | Nicht mehr erfolgreich abschließbar | Kern, z. B. Budget überschritten | Budget von 30 min ohne Einreichung erschöpft. |

Eine Änderung am Vertrag während eines Runs erzeugt eine neue Auftragsversion. Der laufende Run bleibt an die alte Version gebunden
und kann nur über `waiting_input` oder einen neuen Run weiterarbeiten (v4 §9.3).

### 4.2 Run (V0-RUN)

Zustände wie [v4 §9.2](../vision.md#92-drei-getrennte-zustandsautomaten). Autorität: Connector meldet, Kern übernimmt nur Meldungen mit gültiger Epoch.

| ID | Zustand | Beispiel |
|---|---|---|
| V0-RUN-01 | `starting` | Fake-Runtime wird gestartet. |
| V0-RUN-02 | `running` | Fake-Runtime schreibt Zwischenstand. |
| V0-RUN-03 | `paused` | Run wartet auf die Antwort zur Rückfrage. |
| V0-RUN-04 | `cancel_requested` | Owner hat abgebrochen, Connector hat das Signal erhalten. |
| V0-RUN-05 | `cancel_confirmed` | Connector meldet beendeten Prozess. |
| V0-RUN-06 | `exited_ok` | Runtime endet ohne Fehler; über die Qualität sagt das nichts. |
| V0-RUN-07 | `exited_error` | Runtime endet mit Fehlercode. |
| V0-RUN-08 | `lost` | Kein Lebenszeichen nach Ablauf der Lease; Prozesszustand unbekannt. |

### 4.3 Claim (V0-CLM)

| ID | Zustand | Bedeutung | Autorität | Beispiel |
|---|---|---|---|---|
| V0-CLM-01 | `active` | Run darf einreichen und Effekte vorschlagen | Kern vergibt atomar | Epoch 1 an Run `r-1`. |
| V0-CLM-02 | `released` | Run hat freiwillig abgegeben | Run | Run gibt nach Einreichung ab. |
| V0-CLM-03 | `expired` | Lease abgelaufen; stoppt keinen Prozess, entwertet aber Ergebnisse | Kern | `pc-heim` schläft ein, Lease läuft ab. |
| V0-CLM-04 | `fenced` | Durch Neuvergabe mit höherer Epoch ersetzt | Kern bzw. Owner bei Neuvergabe | Owner vergibt an `laptop` neu, Epoch 2; `r-1` wird abgewiesen. |

### 4.4 Effekt (V0-EFF)

| ID | Zustand | Bedeutung | Autorität | Beispiel |
|---|---|---|---|---|
| V0-EFF-01 | `proposed` | Typisierter Effekt mit kanonischen Parametern und Hash vorgeschlagen | Run oder Kern (Übernahme) | `artifact.store` mit Ziel `vorhaben/v-1/` und Artefakt-Hash. |
| V0-EFF-02 | `approval_pending` | Policy verlangt Freigabe | Kern | Inbox zeigt Ziel, Artefakt und Diff zum letzten Blick. |
| V0-EFF-03 | `approved` | Freigabe an Hash, Ziel, Auftragsversion und Epoch gebunden | Owner bzw. Grant-Regel | Owner gibt auf Gerät `handy` frei. |
| V0-EFF-04 | `invalidated` | Freigabe passt nicht mehr | Kern, bei geänderten Bindungen oder Widerruf | Artefakt wurde nach Freigabe geändert, Hash weicht ab. |
| V0-EFF-05 | `intent_recorded` | Ausführung angekündigt, Idempotenz-Key fest | Kern, vor dem Aufruf | Intent `e-1` mit Key `k-…` im Journal. |
| V0-EFF-06 | `done` | Wirkung bestätigt | Effekt-Adapter, vom Kern geprüft | Effekt-Dienst bestätigt Schreiben samt Hash. |
| V0-EFF-07 | `failed` | Wirkung nachweislich nicht eingetreten | Effekt-Adapter | Ziel nicht beschreibbar. |
| V0-EFF-08 | `outcome_unknown` | Intent ohne Ergebnis | Kern | Antwort ging verloren. |
| V0-EFF-09 | `reconciled` | Abgleich hat `done` oder `failed` ermittelt; Ergebnis im Ereignis | Effekt-Adapter per dienstspezifischem Abgleich | Abgleich findet die Datei mit passendem Hash, also eingetreten. |
| V0-EFF-10 | `rejected` | Freigabe verweigert oder Policy verbietet | Owner bzw. Kern | Owner lehnt ab: „falsches Ziel“. |

Ein Effekt in `outcome_unknown` wird nicht automatisch wiederholt. Ein neuer Versuch braucht einen Abgleich und,
wenn dieser „nicht eingetreten“ ergibt, eine neue Freigabe (V0-INV-04).

### 4.5 Rückfrage (V0-RFG)

Anlehnung an das Fragenmodell aus [`docs/fragen/`](../fragen/README.md): Frage-ID, Version, Antwortquelle.
Verhalten bei Ablauf ([Q-20261030-input-expiry](../fragen/human-input/questions/Q-20261030-input-expiry.md)) und
Zuständigkeit ([Q-20261030-input-authority](../fragen/human-input/questions/Q-20261030-input-authority.md)) sind offen.
V0 legt deshalb nur fest: Ablauf oder Schweigen gelten nie als Zustimmung, und Antwortberechtigt ist in V0 nur der Owner.

| ID | Zustand | Autorität | Beispiel |
|---|---|---|---|
| V0-RFG-01 | `open` | Run stellt; Kern prüft Epoch | „Quellen nur deutschsprachig? A: ja, B: auch englisch.“ |
| V0-RFG-02 | `answered` | Owner, von beliebigem gepairtem Gerät | Owner antwortet im zweiten Browser mit B. |
| V0-RFG-03 | `expired` | Kern nach Frist; danach gilt das vorher erklärte Standardverhalten, sofern es keine Freigabe ersetzt | Frist abgelaufen, Standard „Schritt bleibt blockiert“. |
| V0-RFG-04 | `withdrawn` | Run, oder Kern bei Fencing | Neuvergabe mit Epoch 2 zieht die Frage von `r-1` zurück. |

Zwei Antworten auf dieselbe Frageversion: die erste vom Kern bestätigte gilt, die zweite wird als Konflikt sichtbar gemacht, nicht verworfen.

### 4.6 Gerät und Verbindung (V0-GER)

Pairing und Verbindung sind getrennt: Ein gepairtes Gerät kann offline sein, eine offene Verbindung ersetzt kein Pairing.
Verbindungszustände wie [v4 §9.2](../vision.md#92-drei-getrennte-zustandsautomaten).

| ID | Zustand | Autorität | Beispiel |
|---|---|---|---|
| V0-GER-01 | `pairing_pending` | Gerät fordert Kopplungscode an | Connector zeigt Code `482-913`. |
| V0-GER-02 | `paired` | Nur Owner bestätigt | Owner bestätigt in der UI, wählt Befugnis-Vorlage. |
| V0-GER-03 | `revoked` | Owner; wirkt sofort auf neue Aktionen | Laptop verloren, Owner widerruft Token. |
| V0-GER-04 | Verbindung `online` | Kern, nach authentifiziertem Kanal | Connector verbindet ausgehend. |
| V0-GER-05 | Verbindung `degraded` | Kern, z. B. verzögerte ACKs | Heartbeats kommen verspätet. |
| V0-GER-06 | Verbindung `offline` | Kern, nach Presence-TTL | Rechner schläft, UI zeigt „Wartet auf deinen Rechner“. |

**Capabilities** ([Schema](schemas/geraet.schema.json)) tragen Art, Version, unterstützte Datenklassen, Quelle
(`behauptet` oder `nachgewiesen`) und Zeitpunkt der letzten Bestätigung. Lokale Inferenz ist eine Capability der Art
`local_model`. Ein Auftrag mit `local-only` darf nur Geräten zugewiesen werden, die eine passende Capability mit
`local_only: true` melden (V0-INV-09). Gebaut wird das in V4; V0 legt nur das Feld und die Zuweisungsregel fest.

### 4.7 Lokaler Entwurf (V0-ENT)

Für das statische Offline-Frontend (gebaut in V2). Ein Entwurf erhält beim Anlegen auf dem Gerät eine ID und einen Idempotenz-Key.

| ID | Zustand | Autorität | Beispiel |
|---|---|---|---|
| V0-ENT-01 | `local` | Gerät | Owner notiert im Zug ohne Netz einen Auftrag. UI: „noch nicht übertragen“. |
| V0-ENT-02 | `sending` | Gerät | Netz ist zurück, Entwurf wird gesendet. |
| V0-ENT-03 | `confirmed` | Kern, per ACK mit Journal-Position | Hub bestätigt; Entwurf wird zu `draft` (V0-AUF-01). |
| V0-ENT-04 | `conflict` | Kern | Derselbe Auftrag wurde inzwischen auf einem anderen Gerät geändert; beide Fassungen bleiben sichtbar. |

Ein erneutes Senden mit demselben Key erzeugt keinen zweiten Auftrag (V0-INV-06). Freigaben und Abnahmen sind keine Entwürfe:
Sie werden offline nicht vorgemerkt, weil ihre Bindungen (Hash, Epoch) beim Senden veraltet sein können.

### 4.8 Erinnerung (V0-ERI)

| ID | Zustand | Autorität | Beispiel |
|---|---|---|---|
| V0-ERI-01 | `candidate` | Kern oder Agent schlägt aus Episoden vor; mindestens eine Quelle | „Für Vergleiche zuerst ein kleiner messbarer Versuch“, Quelle: Auftrag `a-1`, Rückfrage `q-1`. |
| V0-ERI-02 | `confirmed` | Nur Owner | Owner bestätigt als Projektregel. |
| V0-ERI-03 | `rejected` | Owner | Owner verwirft: „gilt nur hier“. |
| V0-ERI-04 | `superseded` | Owner korrigiert; neue Version zeigt auf die alte | Owner präzisiert: „… bei Technikvergleichen“. |
| V0-ERI-05 | `withdrawn` | Owner zieht zurück; Löschpfad greift (V0-INV-10) | Owner: „vergiss das“. Inhalt erscheint in keinem neuen Kontext. |
| V0-ERI-06 | `conflicted` | Kern markiert Widerspruch zu bestätigter Erinnerung | Neuer Kandidat widerspricht Regel `m-1`; Owner entscheidet. |

Nur `confirmed` geht in Kontextpakete. Training aus Erinnerungen ist nicht Teil von V0 (N0 nutzt synthetische Daten).

## 5. Fallmatrix (V0-FALL)

Jeder Fall ist ein späterer Contract-Test. Spalte „Analyse §8“ verweist auf den bestehenden Abnahmetest.

| ID | Fall | Erwartetes Verhalten | Analyse §8 |
|---|---|---|---|
| V0-FALL-01 | Claim-Anfrage doppelt zugestellt | Ein aktiver Claim; Wiederholung mit gleichem Key liefert denselben Claim | Doppelte Claim-Anfrage |
| V0-FALL-02 | Alter Run nach Neuvergabe reicht ein oder schlägt Effekt vor | Abgewiesen wegen Epoch; Ereignis `claim.rejected_stale_epoch` im Journal | Alter Prozess nach Neuvergabe |
| V0-FALL-03 | Netz weg, Runtime läuft weiter | Connector puffert Ereignisse lokal und liefert per Cursor nach; neue Effekte nur nach erneuter Prüfung | Netz weg, Runtime lebt weiter |
| V0-FALL-04 | Connector-Neustart | Bestätigte Ereignisse bleiben; Zustand der Runtime wird abgeglichen, kein blinder Doppelstart | Connector stirbt |
| V0-FALL-05 | Runtime stirbt | Run `exited_error` oder `lost`; neuer Run mit Übergabepaket, Resume nur bei nachgewiesener Unterstützung | Runtime stirbt |
| V0-FALL-06 | Artefakt nach Freigabe geändert | Freigabe `invalidated`, neue Freigabe nötig | Parameter nach Freigabe geändert |
| V0-FALL-07 | Effekt ausgeführt, Antwort verloren | `outcome_unknown`, dann Abgleich; keine automatische Wiederholung | Effekt ausgeführt, Antwort verloren |
| V0-FALL-08 | Abbruch | `cancel_requested` und `cancel_confirmed` getrennt sichtbar; neue Aktionen gesperrt | Rechteentzug/Abbruch |
| V0-FALL-09 | Gerätetoken widerrufen | Neue Commands des Geräts abgewiesen; offene Effekte dieses Geräts werden abgeglichen | Rechteentzug/Abbruch |
| V0-FALL-10 | `local-only`-Auftrag, kein passendes Gerät online | Auftrag bleibt `open` mit Hinweis; kein Cloud-Fallback | `local-only` |
| V0-FALL-11 | Hub-Instanzwechsel während offener Verbindung | Connector verbindet neu, setzt am Cursor fort; kein Zustand ist nur im RAM einer Instanz | – (neu, Machbarkeit „Vercel“) |
| V0-FALL-12 | Offline-Entwurf doppelt gesendet | Ein Auftrag; zweites Senden liefert dieselbe Journal-Position | – (neu) |
| V0-FALL-13 | Entwurf kollidiert mit Änderung auf anderem Gerät | `conflict`, beide Fassungen sichtbar, Owner wählt | – (neu) |
| V0-FALL-14 | Zwei Antworten auf dieselbe Rückfrage | Erste bestätigte gilt; zweite als Konflikt sichtbar | – (neu) |
| V0-FALL-15 | Erinnerung zurückgezogen | Nicht mehr in neuen Kontextpaketen; Suchindex und Caches folgen; Quelle des Widerrufs im Journal | – (neu) |
| V0-FALL-16 | Modell- oder ASR-Ausgabe enthält Freigabe-Text | Wird als Vorschlag behandelt; keine Freigabe ohne Owner-Aktion an der konkreten Freigabe | – (neu) |
| V0-FALL-17 | Gerät meldet Capability, die beim Start fehlt | Run endet `exited_error`; Capability wird `behauptet` mit Fehlerbefund, nicht weiter `nachgewiesen` | – (neu) |

## 6. Erster durchgängiger Ablauf (V0-ABL-01)

Auftragstyp `research-report`. Runtime: deterministische Fake-Runtime. Effekt: kontrollierter Fake-Effekt-Dienst `artifact.store`.
Synthetische Daten liegen in [`beispiele/`](beispiele/).

| Schritt | Handlung | Erwartete Zustände | Journal-Ereignisse (Typ) |
|---|---|---|---|
| 1 | Owner erfasst per Text einen Rechercheauftrag auf Gerät `browser-a` | ENT `local` → `confirmed`, AUF `draft` | `task.drafted` |
| 2 | Owner gibt frei | AUF `open` | `task.opened` |
| 3 | Connector `pc-heim` übernimmt | CLM `active` (Epoch 1), AUF `in_progress`, RUN `running` | `claim.granted`, `run.started` |
| 4 | Fake-Runtime stellt Rückfrage | RFG `open`, AUF `waiting_input`, RUN `paused` | `input.requested` |
| 5 | Verbindung `pc-heim` wird absichtlich getrennt | Verbindung `offline`; Run lokal `paused` | `device.offline` |
| 6 | Owner beantwortet die Rückfrage auf `browser-b` | RFG `answered` | `input.answered` |
| 7 | `pc-heim` verbindet neu, liefert gepufferte Ereignisse per Cursor nach; Abgleich zeigt Run lebt | Verbindung `online`, RUN `running`, AUF `in_progress` | `device.online`, `run.reconciled` |
| 8 | Fake-Runtime reicht Artefakt mit Quellenbelegen ein | AUF `submitted`, CLM `released` | `task.submitted` |
| 9 | Owner nimmt ab | AUF `accepted` | `task.accepted` |
| 10 | Kern schlägt Übernahme vor; Owner gibt frei | EFF `proposed` → `approved`, AUF `waiting_approval` → `applying` | `effect.proposed`, `effect.approved`, `effect.intent` |
| 11 | Fake-Effekt meldet Erfolg | EFF `done`, AUF `completed` | `effect.done`, `task.completed` |
| 12 | Kern schlägt Erinnerungskandidat mit Quellen vor; Owner bestätigt, korrigiert oder verwirft | ERI `candidate` → `confirmed`/`superseded`/`rejected` | `memory.proposed`, `memory.<entscheidung>` |

**Abnahme von V0-ABL-01 (in V1):** Der Ablauf läuft automatisiert gegen die Fake-Runtime. Zusätzlich laufen Varianten
mit V0-FALL-01, -02, -06, -07, -12 und -14 an den passenden Schritten. Ein Demo-Lauf allein ersetzt diese Prüfungen nicht.

Danach ersetzt der in [Tor B](../entscheidungen/tor-b-claude-anbindung.md) gewählte Claude-Code-Adapter die Fake-Runtime (V4).

## 7. Schemas

| Schema | Inhalt | Beispiel |
|---|---|---|
| [auftrag.schema.json](schemas/auftrag.schema.json) | Vertrag: Ziel, Kriterien, Befugnis, Budget, Datenklasse, Version | [auftrag-recherche.json](beispiele/auftrag-recherche.json) |
| [effekt.schema.json](schemas/effekt.schema.json) | Effekt mit kanonischen Parametern, Bindungen der Freigabe, Zustand | [effekt-artefakt-uebernahme.json](beispiele/effekt-artefakt-uebernahme.json) |
| [geraet.schema.json](schemas/geraet.schema.json) | Gerät, Pairing, Capabilities inkl. lokaler Inferenz | [geraet-pc-heim.json](beispiele/geraet-pc-heim.json) |
| [erinnerung.schema.json](schemas/erinnerung.schema.json) | Erinnerung mit Quellen, Gültigkeit, Versionierung | [erinnerung-kandidat.json](beispiele/erinnerung-kandidat.json) |
| [ereignis.schema.json](schemas/ereignis.schema.json) | Journal-Umschlag: IDs, Sequenz, Epoch, Idempotenz-Key, Inhaltsreferenz | [ereignis-input-answered.json](beispiele/ereignis-input-answered.json) |

Die Schemas beschreiben das Austauschformat zwischen Kern, Adaptern und Ansichten. Speicherlayout, Transport und Serialisierung im Netz
bleiben offen (Tor C/D).

## 8. Offene Punkte und Tor-Zuordnung

| Punkt | Wohin |
|---|---|
| Recherche zuerst statt `code-change`; Tor-A-Testauftrag bleibt `code-change` | [Tor A](../entscheidungen/tor-a-erweiterung-oder-eigener-kern.md) |
| Fake-Runtime gegen Claude-Code-Adapter ersetzen; lokale Modelle als Runtime-Capability | [Tor B](../entscheidungen/tor-b-claude-anbindung.md) |
| Transport für V0-FALL-03/-11: HTTPS-Polling/SSE gegen erneuerbares WSS; Offline-Sync der Entwürfe | [Tor C](../entscheidungen/tor-c-transport-und-haltbarkeit.md) |
| Hub auf Vercel mit dauerhafter Zustellung; statisches Frontend als PWA; Ablage für gesondert löschbare Inhalte | [Tor D](../entscheidungen/tor-d-workflow-hosting-artefakte.md) |
| Ablauf unbeantworteter Rückfragen, Zuständigkeit für Antworten | [Fragen Human-Input](../fragen/human-input/index.md) |
| Vorhaben als eigener Automat; Mehrschritt-Playbooks; Review-Schritt | V1-Spec |
| Löschfristen für Backups und getrennte Geräte; Datenweg für Logs und Audio | V5-Spec, vor echtem Einsatz |

Nächster Schritt nach Review: V1 als Contract-Test-Spec für V0-ABL-01 und die Fallmatrix ausarbeiten, abhängig von den Befunden zu Tor A.
