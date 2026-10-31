# V0 – Ziel und Verträge

> Version 0.2 · 31.10.2026 (0.1: 30.10.2026) · **Entwurf zur Review**, kein Implementierungsbeginn.
> Grundlage: [Vision v5 (Entwurf)](../vision-v5-entwurf.md), [Kern-These](../../research/kern-first-principles.md),
> [Vision v4](../vision.md) §9–13, [Analyse](../analyse-und-uebernahmeplan.md) §3 und §8, [Bauauftrag](../claude-startauftrag-vision-v5.md).
> Vorentscheidungen: [Fragen V0](../fragen/v0-ziel-und-vertraege/index.md), alle drei mit Option A beantwortet.
> Änderung 0.2: Budget-Vorwarnung, Teil-Einreichung und Reparaturgrenze (§4.9) sowie Rückwärtsabnahme am Tor (§4.10).
> Anlass ist Paket P12 des Portierungsplans vom 31.10.2026 (im Folgenden „P12“). Der Owner hat P12 als Spec-Änderung zur Review
> freigegeben (Antwort `A-20261031-p12-kernspec`, Fragenbereich `skill-library`). Die Anstöße aus meta-prompting
> (Vorwarnung, Reparaturgrenze, Zähler aus dem Verlauf) und prompt-architect (Rückwärtsabgleich) sind nur als Mechanismus
> aufgenommen und hier eigenständig formuliert (Clean-Room).
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
- Budget-Vorwarnung, Teil-Einreichung und Reparaturgrenze sowie die Rückwärtsabnahme am Tor für Ergebnisse ohne Code (seit 0.2),
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
| **Schritt** | Teil eines Auftrags mit eigenem Bearbeiter. V0 hat genau einen Arbeitsschritt plus Abnahme. Verlangt der Auftrag eine Rückwärtsabnahme, kommt ein Prüfschritt hinzu (§4.10). |
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
| **Kernzeit** | Zeitpunkt, zu dem der Kern ein Ereignis bestätigt. Budgetrechnungen nutzen nur Kernzeit, nie die Uhr eines Geräts. |
| **Budgetverbrauch** | Aus dem Journal berechneter Verbrauch eines Auftrags je Budgetdimension (Dauer, Kosten, Runs), über alle Runs und Epochs (V0-BUD-01). |
| **Budget-Vorwarnung** | Journal-Ereignis beim ersten Erreichen der Vorwarnschwelle. Mit ihm fordert der Kern den Run auf, abzuschließen, teilweise einzureichen oder eine Übergabe festzuhalten. |
| **Fehlversuch** | Vom Run gemeldeter gescheiterter Versuch an einem benannten Teilziel. Fehlversuche bestimmen den Reparaturverbrauch. |
| **Reparaturgrenze** | Höchster Anteil eines Budgets, den Fehlversuche verbrauchen dürfen, bevor der Kern Strategiewechsel oder Übergabe verlangt. |
| **Übergabepaket** | Arbeitsstand, mit dem ein anderer Bearbeiter ohne den bisherigen Verlauf weitermachen kann; Aufbau nach [resuming-work](../../.agents/skills/resuming-work/SKILL.md), Felder in §7.1. Es ist Datum, keine Anweisung, und verleiht keine Rechte. |
| **Teil-Einreichung** | Einreichung eines unvollständigen Artefakts zusammen mit einem Übergabepaket. |
| **Rückwärtsabnahme** | Prüfung am Tor: Aus dem Ergebnis allein werden die Bedingungen rekonstruiert, die der Auftrag gehabt haben muss. Abweichungen zum tatsächlichen Auftrag werden als Befunde eingeordnet. |
| **Prüfinstanz** | Bearbeiter des Prüfschritts. Den Arbeitsverlauf sieht sie nie, den Auftrag erst, nachdem ihre Rekonstruktion festgeschrieben ist. |

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
| V0-INV-12 | Budgetverbrauch, Vorwarnungen und Fehlversuchszähler werden nur aus dem Journal abgeleitet. Kein Zähler existiert allein im Speicher; Neustart, Instanzwechsel und Neuvergabe setzen nichts zurück. | Kern I2, V0-INV-02, P12 |
| V0-INV-13 | Abnahme entsteht nur durch eine Handlung des Owners. Teil-Einreichung, Fristablauf, Schweigen und eine Rückwärtsabnahme ohne Befund ersetzen sie nie. | Kern I3, V0-AUF-06, P12 |
| V0-INV-14 | Die Prüfinstanz einer Rückwärtsabnahme schreibt ihre Rekonstruktion fest, bevor sie den Auftrag sieht; den Arbeitsverlauf sieht sie nie. Ihre Befunde sind Vorschläge im Sinne von V0-INV-07. | Kern-These §4 Nr. 3, P12 |

Die Spec garantiert nichts über „genau einmal“ hinaus, was ein externer Dienst nicht unterstützt (v4 §9.3 „Grenze“).
Für Effekte ohne Idempotenzunterstützung gilt: höchstens ein Versuch ohne neue Freigabe; danach Abgleich.

## 4. Zustandsautomaten

Autorität bezeichnet, wer einen Übergang auslösen darf. „Kern“ heißt: deterministisch durch den Hub aufgrund von Ereignissen.
Kein Übergang darf von einer Rolle ausgelöst werden, die hier nicht genannt ist.

### 4.1 Auftrag (V0-AUF)

Übernimmt die Zustände aus [v4 §9.2](../vision.md#92-drei-getrennte-zustandsautomaten). V0 nutzt die folgende Teilmenge.
`checking`, `in_review`, `applying` und `rework` sind reserviert, aber im ersten Ablauf nicht erreichbar, bis auf `applying` für den Übernahme-Effekt.
`partially_submitted` (V0-AUF-13) ist gegenüber v4 §9.2 neu.

| ID | Zustand | Bedeutung | Übergang hinein, Autorität | Beispiel |
|---|---|---|---|---|
| V0-AUF-01 | `draft` | Vertrag wird erfasst, noch nicht zur Arbeit freigegeben | Owner erstellt; auch offline als Entwurf (§4.7) | Owner tippt „Vergleiche drei Ansätze für X“ und speichert. |
| V0-AUF-02 | `open` | Version festgeschrieben, wartet auf Claim | Owner gibt frei | Owner bestätigt Ziel, Kriterien, Budget 30 min, Datenklasse `internal`. |
| V0-AUF-03 | `in_progress` | Ein Run hält einen gültigen Claim | Kern, nach erfolgreichem Claim | Connector auf `pc-heim` erhält Claim mit Epoch 1. |
| V0-AUF-04 | `waiting_input` | Offene Rückfrage blockiert den Schritt | Run stellt Rückfrage; Kern überführt | Run fragt: „Quellen nur deutschsprachig?“ |
| V0-AUF-05 | `submitted` | Artefakt eingereicht, Abnahme steht aus | Run mit aktueller Epoch reicht ein | Run reicht `bericht.md` mit Hash und drei Quellenbelegen ein. |
| V0-AUF-06 | `accepted` | Owner hat Kriterien als erfüllt bestätigt | Nur Owner (V0), aus `submitted` oder `partially_submitted`; nie der Bearbeiter selbst, nie automatisch (V0-INV-13) | Owner hakt alle Kriterien ab und nimmt ab. |
| V0-AUF-07 | `waiting_approval` | Übernahme-Effekt wartet auf Freigabe | Kern, wenn Policy Freigabe verlangt | Effekt `artifact.store` in Vorhaben-Ablage wartet. |
| V0-AUF-08 | `applying` | Freigegebener Effekt wird ausgeführt | Kern, nach gültiger Freigabe | Effekt-Dienst schreibt das Artefakt. |
| V0-AUF-09 | `completed` | Übernahme bestätigt | Kern, nach `effect_done` | Artefakt liegt in der Ablage, Hash stimmt. |
| V0-AUF-10 | `outcome_unknown` | Effekt-Antwort fehlt, Wirkung unklar | Kern, bei Intent ohne Ergebnis | Verbindung reißt nach Senden ab; Abgleich läuft. |
| V0-AUF-11 | `cancelled` | Owner hat abgebrochen | Owner; Run-Ende wird getrennt bestätigt (§4.2) | Owner bricht ab, Run steht auf `cancel_requested`. |
| V0-AUF-12 | `failed` | Nicht mehr erfolgreich abschließbar | Kern, z. B. Budget überschritten (V0-BUD-08) | Budget von 30 min ohne Einreichung erschöpft; die Übergabe bleibt erhalten. |
| V0-AUF-13 | `partially_submitted` | Teil-Artefakt mit Übergabepaket eingereicht; Abnahme steht aus und wird nie automatisch erteilt | Run mit aktueller Epoch reicht teilweise ein (V0-BUD-06) | Nach der Vorwarnung reicht der Run zwei von drei Ansatzvergleichen ein und markiert Kriterium `k1` als offen. |

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
| V0-CLM-03 | `expired` | Lease abgelaufen oder vom Kern beendet (Budgetende V0-BUD-08, Verzicht auf die Prüfung V0-RWA-13); stoppt keinen Prozess, entwertet aber Ergebnisse | Kern | `pc-heim` schläft ein, Lease läuft ab. |
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

### 4.9 Budget, Vorwarnung und Übergabe (V0-BUD)

Gilt für den Arbeitsschritt; der Prüfschritt hat ein eigenes Budget (V0-RWA-07). Der Kern erzwingt nur das Budgetende.
Vorwarnung und Reparaturgrenze sind Aufforderungen an den Run, rechtzeitig einen verwertbaren Stand zu sichern. Ob der Run
ihnen folgt, liegt außerhalb des Kerns. Anzeige-Warnungen für den Owner ([v4 §14](../vision.md#14-kosten--budgets)) sind
Ansichten und davon unabhängig. Zahlen in Beispielen sind ungemessen (§8).

| ID | Auslöser oder Zustand | Beobachtbare Reaktion |
|---|---|---|
| V0-BUD-01 | Jede Berechnung des Verbrauchs | **Dauer:** Summe der Zeitspannen in Kernzeit, in denen der Auftrag `in_progress` steht, über alle Versionen und Runs. Die Spanne läuft auch während eines Kern-Ausfalls weiter, weil der Run weiterarbeiten kann. Zeit in `waiting_input`, `outcome_unknown`, `open`, `submitted` und `partially_submitted` zählt nicht (*vorläufig*, §8). **Kosten:** Summe der als `gemeldet` bestätigten Usage-Meldungen (`run.usage_reported`). **Runs:** Zahl der für den Arbeitsschritt vergebenen Claims. |
| V0-BUD-02 | Jede Auswertung, auch nach Neustart, Instanzwechsel oder Neuvergabe | Verbrauch, Vorwarnstatus, Zahl der Fehlversuche und Reparaturverbrauch werden aus Journal-Ereignissen und Kernzeit neu berechnet (V0-INV-12). Ein Zwischenspeicher darf die Rechnung beschleunigen, entscheidet aber nie. Dieselbe Ereignisfolge ergibt zur selben Kernzeit dieselben Werte. |
| V0-BUD-03 | Eine Dimension wird nicht gemessen, z. B. weil eine Abo-Runtime keine Kosten meldet | Ihr Verbrauch ist `unbekannt`, nie 0. Sie löst weder Vorwarnung noch Budgetende aus, und die Ansicht zeigt „Kosten unbekannt“. Geschätzte Werte dienen nur der Anzeige. Die übrigen Dimensionen wirken unverändert. |
| V0-BUD-04 | Der Verbrauch einer gemessenen Dimension erreicht erstmals `vorwarnung_anteil` × Limit der maßgeblichen Auftragsversion (V0-BUD-16) | Der Kern schreibt genau ein `task.budget_warning` mit Dimension, Verbrauch, Limit und dem aus dem Journal berechneten Schwellzeitpunkt `erreicht_bei`. Der Idempotenz-Key ergibt sich aus Auftrag, Version und Dimension; eine erneute Auswertung schreibt kein zweites Ereignis (V0-INV-06). Fehlt `vorwarnung_anteil`, gibt es keine Vorwarnung. |
| V0-BUD-05 | Nach `task.budget_warning` | Der Kern stellt dem Run mit aktivem Claim die Aufforderung zu, abzuschließen (V0-AUF-05), teilweise einzureichen (V0-BUD-06) oder eine Übergabe festzuhalten (V0-BUD-07). Die Vorwarnung ändert keinen Zustand von Auftrag, Run oder Claim. Ist das Gerät offline, wird sie per Cursor nachgeliefert; die Dauer zählt weiter. Die Zustellung belegt nicht, dass der Run sie verarbeitet (V0-INV-08). |
| V0-BUD-06 | Ein Run mit aktueller Epoch reicht vor dem Budgetende teilweise ein, aus `in_progress` oder `waiting_input` | Pflicht sind Artefakt mit Hash und Übergabepaket. Der Kern schreibt `task.partially_submitted`; Auftrag → `partially_submitted` (V0-AUF-13), Claim → `released`. Eine offene Rückfrage des Runs wird zurückgezogen (V0-RFG-04). Fehlt das Übergabepaket, weist der Kern die Teil-Einreichung ab, und der Zustand bleibt. Eine Teil-Einreichung ist auch ohne Vorwarnung zulässig. |
| V0-BUD-07 | Ein Run mit aktueller Epoch hält eine Übergabe fest | Der Kern schreibt `task.handover_recorded`. Der Auftrag bleibt in seinem Zustand, der Run arbeitet weiter; es gilt die jüngste gültige Übergabe. Ein Folgerun liest sie als Daten, prüft ihre Aussagen gegen den aktuellen Stand und erhält aus ihr weder Rechte noch Freigaben (V0-INV-07). |
| V0-BUD-08 | Eine gemessene Dimension erreicht ihr Limit, ohne dass eine Einreichung oder Teil-Einreichung bestätigt ist. Bei Runs: Der Claim des letzten erlaubten Runs endet ohne Einreichung | Harter Schnitt nach V0-AUF-12: Der Kern schreibt `task.failed` mit `grund: budget_exhausted`, setzt einen noch aktiven Claim auf `expired` und fordert den Run zum Abbruch auf; `cancel_requested` und `cancel_confirmed` bleiben getrennt sichtbar. `task.failed` verweist auf die jüngste gültige Übergabe des Runs, falls es eine gibt, und immer auf eine Kern-Übergabe (`quelle: kern`). Die Kern-Übergabe enthält nur, was im Journal steht: Auftragsversion, Verbrauch je Dimension, Rückfragen und Antworten, gemeldete Zwischenstände, Fehlversuche sowie offene und unklare Effekte. Die Qualität bewertet sie nicht. |
| V0-BUD-09 | Eine Einreichung, Teil-Einreichung oder Übergabe trifft ein, nachdem das Budget nach Kernzeit erschöpft ist, auch wenn `task.failed` noch nicht geschrieben ist | Der Kern schreibt zuerst das Budgetende (V0-BUD-08) und weist die Meldung danach mit `claim.rejected_inactive` ab, weil der Claim nicht mehr aktiv ist. Das Ergebnis hängt also nicht davon ab, wann der Kern das Budgetende bemerkt. |
| V0-BUD-10 | Der Auftrag steht in `partially_submitted` | Nur der Owner führt heraus: Abnahme (V0-AUF-06; offene Kriterien bleiben im Ereignis sichtbar), Fortsetzung mit neuer Auftragsversion (V0-BUD-16; → `open`, danach neuer Claim mit höherer Epoch und dem Übergabepaket im Kontextpaket) oder Abbruch (`cancelled`). Nichts davon geschieht automatisch, auch nicht nach einer Frist oder bei Schweigen (V0-INV-13). |
| V0-BUD-11 | Der Auftrag steht in `failed` | Endzustand; spätere Meldungen ändern ihn nicht. Eine Fortsetzung ist ein neuer Auftrag, dessen Ausgangsstand auf die Übergaben verweist. |
| V0-BUD-12 | Ein Run mit aktueller Epoch meldet `run.attempt_failed` mit Bezug, dem stabilen Namen eines Teilziels | Der Kern schreibt die Meldung; sie zählt als Fehlversuch. Meldungen mit veralteter Epoch weist er ab; sie zählen nicht. Ist für den Bezug keine Reparaturphase offen, beginnt mit dem Fehlversuch eine. Sie endet mit `run.attempt_succeeded` oder `run.strategy_changed` für diesen Bezug oder mit dem Ende des Claims. Der Reparaturverbrauch je Dimension (Dauer, Kosten) ist der Verbrauch innerhalb aller Reparaturphasen zusammen; überlappende Phasen zählen einmal. Er wird nie zurückgesetzt. |
| V0-BUD-13 | Der Reparaturverbrauch einer Dimension erreicht `reparatur_anteil_max` × Limit | Der Kern schreibt je Version und Dimension einmal `task.repair_limit_reached` und fordert vom Run einen Strategiewechsel (`run.strategy_changed` mit Begründung) oder eine Übergabe bzw. Teil-Einreichung. Meldet der Run danach einen weiteren Fehlversuch, gleich ob nach einem Strategiewechsel oder ohne, schreibt der Kern einmal `task.handover_requested` und fordert nur noch Übergabe oder Teil-Einreichung. Die Reparaturgrenze allein führt nie zu `failed`; das bleibt dem Budgetende vorbehalten. Fehlt `reparatur_anteil_max`, gibt es keine Reparaturgrenze. |
| V0-BUD-14 | Ein Effekt steht bei Vorwarnung oder Budgetende in `outcome_unknown` | Weder Vorwarnung noch Budgetende ändern den Effekt. Der Abgleich läuft unabhängig vom Budget weiter, ohne automatische Wiederholung (V0-INV-03, §4.4). Solange der Auftrag in `outcome_unknown` steht, zählt die Dauer nicht; erreicht eine andere Dimension in dieser Zeit ihr Limit, wertet der Kern das Budgetende erst nach dem Abgleich aus. Jede Übergabe nennt den Effekt bis zum Abgleich als unklar. |
| V0-BUD-15 | Neuvergabe mit höherer Epoch (V0-CLM-04) | Verbrauch, Vorwarnungen und Reparaturverbrauch gelten je Auftrag über alle Runs und Epochs. Die Neuvergabe setzt nichts zurück und löst für dieselbe Version und Dimension keine zweite Vorwarnung aus. Der neue Claim erhält Budgetstand, geschriebene Vorwarnungen und die jüngste gültige Übergabe. Meldungen des alten Runs, auch Antworten auf die Vorwarnung, weist der Kern nach V0-INV-05 ab. |
| V0-BUD-16 | Der Owner ändert das Budget | Es entsteht eine neue Auftragsversion (§4.1). Der bisherige Verbrauch bleibt. Maßgeblich sind die Limits der Version, an die der aktive Claim gebunden ist, ohne aktiven Claim die der jüngsten Version. Ein laufender Run arbeitet also unter dem Budget seiner Version weiter, bis er nach §4.1 an die neue gelangt. Vorwarnung und Reparaturgrenze können je Version erneut ausgelöst werden. |

**Grenzen der Zählung.** Der Kern kennt nur gemeldete Fehlversuche. Verschweigt ein Run sie, bleibt die Reparaturgrenze
wirkungslos; das Budgetende wirkt trotzdem. Nachgelieferte Meldungen (V0-FALL-03) zählen ab ihrer Bestätigung im Kern.
Nach Offline-Phasen kann der Reparaturverbrauch deshalb vom tatsächlichen Verlauf abweichen. Ob ein Adapter Fehlversuche
selbst aus der Spur der Runtime ableiten kann, ist offen (§8).

### 4.10 Rückwärtsabnahme (V0-RWA)

Gedacht für Ergebnisse ohne Code, bei denen deterministische Checks wenig abdecken. Die Rückwärtsabnahme ist ein Prüfschritt
der Stufe Agent-Review ([v4 §10](../vision.md#10-playbooks--checks)). Den allgemeinen Review-Schritt regelt erst die V1-Spec (§8);
V0 legt nur diesen eng umrissenen Prüfschritt fest. Während der Prüfung bleibt der Auftrag in `submitted` bzw. `partially_submitted`;
die reservierten Zustände `checking` und `in_review` werden nicht genutzt. Die Zustände tragen die IDs 01–05, die Regeln folgen ab 06.

| ID | Zustand | Bedeutung | Übergang hinein, Autorität | Beispiel |
|---|---|---|---|---|
| V0-RWA-01 | `requested` | Prüfung angelegt, gebunden an Artefakt-Hash, Auftragsversion und Einreichungsereignis | Kern, nach bestätigter Einreichung oder Teil-Einreichung, wenn der Auftrag die Prüfung verlangt | `bericht.md` ist eingereicht; Prüfung `rw-1` wird angelegt. |
| V0-RWA-02 | `reconstructing` | Prüfinstanz hält den Claim des Prüfschritts und kennt nur das Artefakt | Kern vergibt den Claim | Prüfinstanz auf `pc-heim` erhält Epoch 1 des Prüfschritts. |
| V0-RWA-03 | `reconstructed` | Rekonstruierte Bedingungen stehen mit Hash im Journal; erst jetzt erhält die Prüfinstanz die Vergleichsgrundlage | Prüfinstanz reicht ein, Kern bestätigt | Fünf Bedingungen, darunter „nur quelloffene Ansätze“. |
| V0-RWA-04 | `completed` | Abgleich liegt vor, mit null oder mehr Befunden im Journal; Endzustand | Prüfinstanz mit aktueller Epoch | Ein Befund der Klasse `angenommen`. |
| V0-RWA-05 | `not_performed` | Ohne Ergebnis beendet, Grund im Ereignis (Prüfbudget erschöpft, Fehler, Verzicht); Endzustand | Kern; Verzicht nur durch den Owner | Das Prüfbudget von 5 min ist erschöpft, bevor der Abgleich vorliegt. |

| ID | Auslöser oder Zustand | Beobachtbare Reaktion |
|---|---|---|
| V0-RWA-06 | Eine Einreichung oder Teil-Einreichung ist bestätigt, und der Auftrag verlangt eine Rückwärtsabnahme | Der Kern legt genau eine Prüfung an (Idempotenz-Key aus dem Einreichungsereignis) und schreibt `task.backward_review_requested`. Ohne dieses Verlangen gibt es keine Prüfung. Befunde gelten nur für den gebundenen Artefakt-Hash; eine spätere Einreichung bekommt eine eigene Prüfung. Bei `code-change` ersetzt die Prüfung keine deterministischen Checks. |
| V0-RWA-07 | Vergabe des Prüfschritts | Die Prüfinstanz ist ein eigener Run mit eigenem Claim, eigener Epoch-Folge und eigenem Budget (`rueckwaertsabnahme.budget`). Sie ist nicht der Run des Arbeitsschritts und erbt keinen Kontext von ihm. Es gilt die Datenklasse des Auftrags (V0-INV-09): Ohne passendes Gerät bleibt die Prüfung `requested` mit Hinweis; einen Ausweg in die Cloud gibt es nicht. Das Prüfbudget kennt nur das harte Ende; danach folgt `not_performed`. |
| V0-RWA-08 | Phase 1: Eingabe der Prüfinstanz | Sie erhält nur das eingereichte Artefakt mit den darin enthaltenen Belegen. Sie erhält weder Auftrag noch Übergabepaket, Kriterienstand, Run-Verlauf, Rückfragen, Antworten oder Erinnerungen. Der Kern hält die übergebenen Inhalte als Eingabemanifest (Liste von Hashes) im Journal fest. |
| V0-RWA-09 | Die Prüfinstanz reicht ihre Rekonstruktion ein | Je Bedingung enthält sie Text und Fundstelle im Artefakt. Der Kern schreibt `task.backward_reconstruction_recorded` mit dem Hash der Rekonstruktion; Prüfung → `reconstructed`. Eine abweichende zweite Rekonstruktion derselben Prüfung weist er ab; eine identische Wiederholung liefert dasselbe Ergebnis (V0-INV-06). |
| V0-RWA-10 | Phase 2, erst nach V0-RWA-09 | Der Kern übergibt die Vergleichsgrundlage: Ziel, Ausgangsstand und Abnahmekriterien der Auftragsversion, an die der einreichende Run gebunden war, sowie die bestätigten Antworten auf Rückfragen dieses Auftrags. Das Eingabemanifest wird ergänzt. |
| V0-RWA-11 | Die Prüfinstanz reicht den Abgleich ein | Jede Abweichung gehört zu genau einer Klasse: `uebersehen` (steht im Auftrag oder in einer Antwort, fehlt aber in der Rekonstruktion), `angenommen` (steht in der Rekonstruktion, aber nicht im Auftrag) oder `anders_verstanden` (steht in beiden, ist aber abweichend ausgelegt). Der Kern schreibt je Abweichung ein `task.backward_finding` und danach `task.backward_review_completed` mit der Zahl je Klasse. Null Befunde sind ein gültiges Ergebnis. Meldungen mit veralteter Epoch weist er ab (V0-INV-05). |
| V0-RWA-12 | Befunde liegen vor | Befunde sind Vorschläge (V0-INV-07, V0-INV-14). Sie ändern keinen Auftragszustand und bewerten kein Kriterium. Sie lösen weder Nacharbeit noch Freigabe noch Übernahme aus. Der Owner sieht sie bei der Abnahme und kann einzelne als `zutreffend` oder `unzutreffend` markieren (`task.backward_finding_rated`). Das ist Messgrundlage, keine Abnahme. |
| V0-RWA-13 | Der Owner nimmt ab, solange die Prüfung weder `completed` noch `not_performed` ist | Die Abnahme braucht in derselben Handlung einen ausdrücklichen Verzicht (`task.backward_review_waived`). Der Kern setzt dann den Claim des Prüfschritts auf `expired`; Prüfung → `not_performed` mit Grund `verzicht`. Spätere Meldungen der Prüfinstanz weist er mit `claim.rejected_inactive` ab. Ohne Verzicht weist der Kern die Abnahme ab, und der Zustand bleibt. |
| V0-RWA-14 | Die Prüfung endet `not_performed` | Die Ansicht zeigt „nicht durchgeführt“ mit Grund, nie „ohne Befund“; Messungen zählen beide Ausgänge getrennt. Die Abnahme bleibt beim Owner wie bei jedem anderen Ausgang (V0-INV-13). |

**Reichweite.** Die Rückwärtsabnahme prüft, ob das Ergebnis zu den vereinbarten Bedingungen passt, nicht, ob seine Aussagen
stimmen. Erfundene, in sich stimmige Angaben und falsche Quellen findet sie nicht; dafür bleiben Belegprüfung und Owner zuständig.
Gibt das Artefakt den Auftrag wörtlich wieder, ist Phase 1 nicht mehr blind, und die Prüfung sagt entsprechend weniger aus.

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

### 5.1 Ergänzung 0.2: Budget und Rückwärtsabnahme

Ausgangsauftrag aller Fälle ist [auftrag-recherche.json](beispiele/auftrag-recherche.json) (`max_dauer_min` 30, `max_runs` 2),
ergänzt um `vorwarnung_anteil` 0,8 und `reparatur_anteil_max` 0,5. Beide Werte sind Beispiele, nicht gemessen.
Minutenangaben meinen den Dauer-Verbrauch nach V0-BUD-01 auf einer simulierten Kernuhr. Run `r-1` hält Claim Epoch 1.

| ID | Typ | Ausgangslage | Störung | Erwartung | Deckt |
|---|---|---|---|---|---|
| V0-FALL-18 | normal | `in_progress`, Verbrauch 23 min | Uhr auf 24 min; danach reicht `r-1` zwei von drei Ansätzen mit Übergabepaket ein, `k1` als offen markiert | Genau ein `task.budget_warning` (Dauer, `erreicht_bei` 24 min), Aufforderung an `r-1`. Danach Auftrag `partially_submitted`, Claim `released`. Uhr auf 40 min: kein `task.failed`, kein `task.accepted`, kein Effekt | BUD-01, -04, -05, -06; AUF-13; INV-13 |
| V0-FALL-19 | fehler | wie 18 nach der Vorwarnung; `r-1` hält bei 26 min eine Übergabe fest, reicht aber nichts ein | Uhr auf 30 min; bei 31 min reicht `r-1` vollständig ein; danach versucht der Owner, den Auftrag wieder zu öffnen | Bei 30 min `task.failed` mit `grund: budget_exhausted`, Verweis auf die Übergabe von 26 min und auf eine Kern-Übergabe; Claim `expired`, Abbruchaufforderung an `r-1`. Einreichung von 31 min: `claim.rejected_inactive`, Zustand bleibt `failed`; Wiederöffnen abgewiesen. Variante ohne Übergabe von 26 min: nur Kern-Übergabe | BUD-07, -08, -09, -11; AUF-12 |
| V0-FALL-20 | grenz | Vorwarnung bei 24 min geschrieben | Kern-Neustart bei 25 min mit leerem Zwischenspeicher, wieder bereit bei 26 min | Kein zweites `task.budget_warning`. Verbrauch bei 27 min ist 27 min (der Ausfall zählt mit). Eine Teil-Einreichung bei 27 min wird bestätigt; ohne sie käme das Budgetende bei 30 min, wie ohne Neustart. Fehlversuchszahl und Reparaturverbrauch sind vor und nach dem Neustart gleich | BUD-01, -02, -04; INV-12; INV-06 |
| V0-FALL-21 | grenz | Vorwarnung bei 24 min an `r-1` | Owner vergibt bei 25 min an `laptop` neu (Epoch 2); `r-1` reicht bei 26 min teilweise ein | Teil-Einreichung von `r-1` abgewiesen (`claim.rejected_stale_epoch`). Dauer läuft weiter, kein zweites `task.budget_warning` für Dauer; eine eigene Vorwarnung für Runs (2 von 2) ist zulässig. Claim Epoch 2 trägt Budgetstand, Vorwarnung und jüngste Übergabe | BUD-02, -15; INV-05; INV-12 |
| V0-FALL-22 | fehler | `in_progress`, kein Fehlversuch | `r-1` meldet bei 2, 8 und 14 min Fehlversuche mit Bezug `quellen-abruf`, keinen Erfolg; bei 18 min `run.strategy_changed`; bei 20 min Fehlversuch mit Bezug `quellen-abruf-2` | Bei 17 min (Reparaturverbrauch 15 min = 0,5 × 30) genau ein `task.repair_limit_reached`. Die Phase endet bei 18 min. Der Fehlversuch bei 20 min führt zu genau einem `task.handover_requested`. Kein `task.failed` vor 30 min. Neu berechnete Fehlversuchszahl und Reparaturverbrauch stimmen mit den angezeigten überein | BUD-02, -12, -13 |
| V0-FALL-23 | fehler | `in_progress` bei 20 min; `r-1` hat `artifact.store` für einen Zwischenstand vorgeschlagen, die Freigabe liegt vor, Intent `e-1` ist geschrieben | Antwort geht verloren, Auftrag `outcome_unknown`; Kernuhr läuft 15 min weiter; `r-1` hält eine Übergabe fest | Dauer bleibt bei 20 min; kein `task.budget_warning`, kein `task.failed`. `e-1` bleibt `outcome_unknown` und wird nicht wiederholt; die Übergabe nennt `e-1` als unklar. Erst nach dem Abgleich wertet der Kern das Budget wieder aus | BUD-01, -07, -14; INV-03 |
| V0-FALL-24 | fehler | Auftrag zusätzlich mit `max_kosten_eur` 2; die Runtime meldet keine Kosten | Uhr auf 24 min | Keine Vorwarnung und kein Budgetende für Kosten; die Ansicht zeigt „Kosten unbekannt“, nicht „0 €“. Vorwarnung für Dauer bei 24 min wie in 18 | BUD-03 |
| V0-FALL-25 | grenz | `partially_submitted` seit Tag 0 bei 27 min Verbrauch | Kein Owner-Handeln bis Tag 30 | Zustand unverändert; kein `task.accepted`, `task.failed` oder `task.cancelled`; Verbrauch bleibt 27 min | BUD-01, -10; AUF-13; INV-13 |
| V0-FALL-26 | normal | wie 25 | Owner setzt fort: Version 2 mit `max_dauer_min` 60 und `max_runs` 3 | Auftrag `open`, dann neuer Claim mit Epoch 2 und Übergabepaket im Kontextpaket. Verbrauch läuft ab 27 min weiter; Vorwarnung für Version 2 bei 48 min; keine Vorwarnung für Runs (2 von 3) | BUD-10, -16; AUF-13 |
| V0-FALL-27 | normal | Auftrag verlangt Rückwärtsabnahme. Rückfrage `q-beispiel-1` ist mit B („auch englisch“) beantwortet. `bericht.md` vergleicht nur quelloffene Ansätze, ohne dass der Auftrag das verlangt | Einreichung bestätigt | Prüfung `requested`, dann `reconstructing`; das Eingabemanifest von Phase 1 enthält genau den Artefakt-Hash. Die Rekonstruktion enthält „nur quelloffene Ansätze“ und „deutsch- und englischsprachige Quellen“. Abgleich: genau ein Befund `angenommen` zu „nur quelloffene Ansätze“. Die englischsprachigen Quellen ergeben keinen Befund, weil die Antwort zur Vergleichsgrundlage gehört. Auftrag bleibt `submitted`: kein `task.accepted`, keine Nacharbeit, kein Effekt | RWA-01 bis -04, -06, -08 bis -12; INV-14 |
| V0-FALL-28 | grenz | wie 27, aber `bericht.md` deckt alle Bedingungen und setzt keine zusätzlichen voraus | Abgleich ohne Abweichung | `task.backward_review_completed` mit 0 Befunden. Der Auftrag bleibt `submitted`, bis der Owner abnimmt; kein Ereignis von Kern oder Prüfinstanz führt zu `accepted` | RWA-11, -12; INV-13 |
| V0-FALL-29 | fehler | Prüfung `reconstructed`, Vergleichsgrundlage übergeben | Prüfinstanz reicht eine geänderte Rekonstruktion ein, danach die erste noch einmal unverändert | Geänderte Fassung abgewiesen; die erste Rekonstruktion und ihr Hash bleiben maßgeblich. Die unveränderte Wiederholung liefert dasselbe Ergebnis ohne neues Ereignis | RWA-09; INV-14; INV-06 |
| V0-FALL-30 | grenz | Prüfung `reconstructing` | Owner nimmt ab, (a) ohne Verzicht, (b) mit Verzicht; danach meldet die Prüfinstanz einen Befund | (a) Abnahme abgewiesen, Zustand bleibt. (b) `task.backward_review_waived`, Prüfung `not_performed` mit Grund `verzicht`, Auftrag `accepted`; der spätere Befund wird mit `claim.rejected_inactive` abgewiesen | RWA-05, -13; CLM-03; INV-13 |
| V0-FALL-31 | fehler | Prüfung `reconstructing`, Prüfbudget 5 min | Prüfinstanz liefert bis 5 min nichts | Prüfung `not_performed` mit Grund Budget. Die Ansicht zeigt „nicht durchgeführt“, nicht „ohne Befund“. Auftrag bleibt `submitted`, die Abnahme liegt beim Owner | RWA-05, -07, -14 |
| V0-FALL-32 | fehler | `local-only`-Auftrag verlangt Rückwärtsabnahme; kein Gerät mit passender `local_model`-Capability ist online | Einreichung bestätigt | Prüfung bleibt `requested` mit Hinweis; keine Vergabe an ein Cloud-Gerät. Der Owner kann nur mit Verzicht abnehmen | RWA-07, -13; INV-09 |

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
V0-FALL-18 bis -32 laufen als eigene Varianten mit simulierter Kernuhr. V0-ABL-01 selbst bleibt ohne Vorwarnschwelle und ohne
Rückwärtsabnahme.

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

### 7.1 Erweiterungen aus 0.2

Die JSON-Schemas und Beispiele werden nach der Review in einem eigenen Schritt nachgezogen (§8). Bis dahin gilt diese Beschreibung.
Alle Änderungen sind additiv: Dokumente nach 0.1 bleiben gültig.

| Schema | Änderung |
|---|---|
| [auftrag.schema.json](schemas/auftrag.schema.json) | `zustand` zusätzlich `partially_submitted`. `budget.vorwarnung_anteil` (Zahl, 0 < x < 1) und `budget.reparatur_anteil_max` (Zahl, 0 < x ≤ 1), beide optional; fehlen sie, gibt es keine Vorwarnung bzw. keine Reparaturgrenze. `rueckwaertsabnahme` (optional) mit `verlangt` (bool) und `budget` (`max_dauer_min`, optional `max_kosten_eur`); fehlt das Feld, gibt es keine Rückwärtsabnahme. |
| [ereignis.schema.json](schemas/ereignis.schema.json) | Keine Änderung am Typmuster. Neue Typen: `task.budget_warning`, `task.partially_submitted`, `task.handover_recorded`, `task.handover_requested`, `task.repair_limit_reached`, `task.failed` (mit `daten.grund`), `run.usage_reported`, `run.attempt_failed`, `run.attempt_succeeded`, `run.strategy_changed`, `task.backward_review_requested`, `task.backward_reconstruction_recorded`, `task.backward_finding`, `task.backward_review_completed`, `task.backward_review_not_performed`, `task.backward_review_waived`, `task.backward_finding_rated`, `claim.rejected_inactive` (Meldung auf einem Claim, der nicht mehr `active` ist). Die Prüfinstanz meldet als Akteur `run`. |
| neu: Übergabepaket | Felder siehe unten |
| neu: Rückwärts-Befund | Felder siehe unten |

**Übergabepaket** (V0-BUD-06 bis -08). Texte liegen per `inhalt_ref` in gesondert löschbaren Objekten (V0-INV-11).

| Feld | Inhalt |
|---|---|
| `auftrag_id`, `auftrag_version`, `epoch` | Bezug; bei `quelle: kern` die Epoch des letzten Claims |
| `quelle` | `run` oder `kern` |
| `zeit` | Kernzeit der Bestätigung |
| `ausgangsstand` | Referenzen mit Hash, auf denen der Stand beruht |
| `ergebnisse` | Erledigtes mit Artefakt-Hash und Beleg |
| `kriterienstand` | Je Abnahmekriterium `erfuellt_laut_bearbeiter`, `offen` oder `unklar`. Das ist ein Vorschlag, keine Abnahme (V0-INV-07); bei `quelle: kern` immer `unklar` |
| `offen` | Offene Rückfrage-IDs, Annahmen, Blockaden |
| `unklare_wirkungen` | Effekt-IDs ohne Abschlussbeleg, insbesondere in `outcome_unknown` |
| `budgetstand` | Vom Kern nach V0-BUD-01 berechnet, nie vom Run übernommen |
| `naechster_schritt` | Genau einer; bei `quelle: kern` immer „Owner entscheidet über Fortsetzung“ |
| `inhalt_ref` | Referenz auf den Text der Übergabe |

**Rückwärts-Befund** (V0-RWA-11):

| Feld | Inhalt |
|---|---|
| `pruefung_id`, `artefakt_hash`, `auftrag_version`, `epoch` | Bindung; `epoch` ist die des Prüfschritts |
| `klasse` | `uebersehen`, `angenommen` oder `anders_verstanden` |
| `bezug_auftrag` | Kriterium-ID, `ziel`, `ausgangsstand` oder Antwort-ID; bei `angenommen` leer |
| `bezug_rekonstruktion` | Nummer der rekonstruierten Bedingung; bei `uebersehen` leer |
| `fundstelle` | Stelle im Artefakt, falls vorhanden |
| `inhalt_ref` | Bedingungstexte und Begründung (V0-INV-11) |

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
| Vorwarn- und Reparaturschwelle sind ungemessen; 0,8 und 0,5 in §5.1 sind Beispielwerte. Offen ist auch der Standardwert einer Auftragsvorlage | Messung vor der V1-Spec, z. B. im Wochentest der [Kern-These §7](../../research/kern-first-principles.md#7-riskanteste-annahme-und-billigster-test) |
| Wartezeit auf Rückfragen zählt nicht gegen die Dauer (V0-BUD-01, vorläufig) | Owner-Review dieser Spec |
| Melden die Runtimes Kosten? Ohne Meldung wirken nur Dauer und Runs (V0-BUD-03). Kann der Adapter Fehlversuche aus der Spur der Runtime ableiten, statt sich auf Selbstmeldungen zu verlassen? | [Tor B](../entscheidungen/tor-b-claude-anbindung.md) |
| Kosten, Runtime und Modell der Prüfinstanz; ob sie ein anderes Modell als der Bearbeiter braucht. Nutzen gegen Kosten über die Owner-Markierungen (V0-RWA-12) messen | [Tor B](../entscheidungen/tor-b-claude-anbindung.md), danach V1-Spec |
| Budgetuhr als dauerhafter Zeitgeber und Takt der Schwellenauswertung. Budgetende während eines Kern-Ausfalls: Nachfrist oder nicht (betrifft V0-BUD-01 und -09) | [Tor D](../entscheidungen/tor-d-workflow-hosting-artefakte.md), [Tor C](../entscheidungen/tor-c-transport-und-haltbarkeit.md) |
| Lassen sich Vorwarnung, Teil-Einreichung und eine blinde Prüfinstanz in Paperclip oder OpenHands abbilden? | [Tor A](../entscheidungen/tor-a-erweiterung-oder-eigener-kern.md) |
| Rückwärtsabnahme als Standard für `research-report`; Verhältnis zum allgemeinen Review-Schritt | V1-Spec |
| Rückweg aus `outcome_unknown` in den vorigen Auftragszustand ist nicht festgelegt (betrifft V0-BUD-14) | V1-Spec |
| Budgeterhöhung während eines laufenden Runs: wie der Run ohne Unterbrechung an die neue Version gelangt (betrifft V0-BUD-16) | V1-Spec |
| Inhalte verspäteter, abgewiesener Einreichungen zur Ansicht aufbewahren oder nicht | V1-Spec |
| JSON-Schemas und Beispiele nach §7.1 nachziehen | Eigener Schritt nach der Review |

Nächster Schritt nach Review: V1 als Contract-Test-Spec für V0-ABL-01 und die Fallmatrix ausarbeiten, abhängig von den Befunden zu Tor A.
