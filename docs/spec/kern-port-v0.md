# Kern-Port V0 – Prüfgrenze für die Vertragssuite

> Version 0.1 · 31.10.2026 · **Entwurf zur Review**, kein Implementierungsbeginn vor Owner-Entscheidung zum [Gesamtplan](../../research/agent-hub/operations/gesamtplan-2026-11.md) (Paket M1.1).
> Grundlage: [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) (Begriffe, Automaten, Fallmatrix, V0-ABL-01), [Runtime-Adapter V0](runtime-adapter-v0.md), [Ereignis-Schema](schemas/ereignis.schema.json).
> Der Kern-Port ist **keine Produkt-API und kein Transport** (Tor C). Er ist die schmalste Schnittstelle, über die eine Vertragssuite einen Kern von außen bedienen und beobachten kann.
> Dieselbe Suite soll gegen einen wegwerfbaren Referenzkern, gegen Paperclip bzw. OpenHands (über Adapter, Tor A) und später gegen den echten Kern laufen.

## 1. Ziel und Umfang

**Im Umfang:**
- die Prüfgrenze (Nachrichtenformat, Prozessgrenze),
- die Commands mit Akteur, Eingaben, Ergebnis und erwarteten Journal-Ereignissen,
- typisierte Ablehnungen,
- Steuerbefehle, die nur die Suite nutzt (Uhr, Neustart, Verbindung, Störungen),
- die Zuordnung jedes Schritts von V0-ABL-01 und jedes V0-Falls zu Commands.

**Nicht im Umfang:** Rechte- und Grant-Modell über V0 hinaus, Speicherlayout, Authentifizierung, Produkt-Transport, UI.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Kern-Port** | Menge der Commands und Abfragen dieser Spec. |
| **Prüfling** | Eine Implementierung des Kern-Ports: Referenzkern, Adapter auf ein Fremdsystem oder der echte Kern. |
| **Vertragssuite** | Tests, die nur über den Kern-Port mit dem Prüfling sprechen. |
| **Steuerbefehl** | Command mit Präfix `test.`, der Bedingungen herstellt, die im Betrieb von außen kommen (Kernuhr, Neustart, Netztrennung). Nur für die Suite. |
| **Nicht abbildbar** | Ergebnis eines Falls, wenn der Prüfling ein benötigtes Command oder einen Steuerbefehl nicht anbietet. Zählt weder als erfüllt noch als Fehler der Suite. |

## 3. Prüfgrenze

| ID | Anforderung |
|---|---|
| KP-GRZ-01 | Der Prüfling ist ein eigener Prozess. Die Suite schreibt je Anfrage genau eine JSON-Zeile auf seine Standardeingabe und liest je Anfrage genau eine JSON-Zeile Antwort von seiner Standardausgabe (JSON Lines, UTF-8). |
| KP-GRZ-02 | Eine Anfrage hat die Felder aus [kern-port-nachricht.schema.json](schemas/kern-port-nachricht.schema.json): `id`, `command`, `akteur`, `idempotenz_key` (Pflicht für schreibende Commands) und `args`. |
| KP-GRZ-03 | Eine Antwort trägt dieselbe `id` und entweder `ok: true` mit `ergebnis` und der Journal-Position `journal_seq` des letzten dadurch geschriebenen Ereignisses, oder `ok: false` mit `fehler.code` aus §6. |
| KP-GRZ-04 | Eine Zeile, die kein gültiges JSON oder kein gültiges Anfrageschema ist, beantwortet der Prüfling mit `fehler.code: anfrage_ungueltig` und ändert keinen Zustand. |
| KP-GRZ-05 | Ein unbekanntes Command beantwortet der Prüfling mit `command_unbekannt`. Ein Command, das er bewusst nicht anbietet, beantwortet er mit `nicht_abbildbar`; die Suite wertet den Fall dann als nicht abbildbar. |
| KP-GRZ-06 | Die Prüfgrenze ist bewusst einfach und sprachunabhängig. Sie legt nichts über den Produkt-Transport fest (Tor C). *Vorläufig* bis zur Owner-Entscheidung über den Gesamtplan. |

## 4. Invarianten der Grenze

| ID | Invariante | Herkunft |
|---|---|---|
| KP-INV-01 | Eine Wiederholung eines schreibenden Commands mit gleichem `idempotenz_key` und gleichen `args` liefert dieselbe Antwort und schreibt kein Ereignis. Gleicher Key mit anderen `args` ergibt `key_konflikt`. | V0-INV-06 |
| KP-INV-02 | Jede Zustandsänderung ist über `journal.read` als Ereignis nach [ereignis.schema.json](schemas/ereignis.schema.json) sichtbar. Ein Zustand, der nur in einer Antwort, aber nicht im Journal steht, gilt als nicht eingetreten. | V0-INV-02 |
| KP-INV-03 | Jede Ablehnung wegen veralteter oder inaktiver Epoch erzeugt zusätzlich ein Journal-Ereignis (`claim.rejected_stale_epoch` bzw. `claim.rejected_inactive`). Andere Ablehnungen schreiben nichts. | V0-INV-05, V0-FALL-02 |
| KP-INV-04 | Der `akteur` einer Anfrage bestimmt die Autorität. Ein Command, dessen Autorität laut V0 bei einem anderen Akteur liegt, wird mit `nicht_berechtigt` abgelehnt; Text in `args` ändert daran nichts. | V0 §4, V0-INV-07 |
| KP-INV-05 | Steuerbefehle (`test.*`) schreiben keine fachlichen Ereignisse außer denen, die der simulierte Vorgang im Betrieb auch auslösen würde (z. B. `device.offline` nach Netztrennung und Presence-TTL). | – |

## 5. Commands

Akteur-Arten wie im Ereignis-Schema: `owner`, `run`, `geraet`, `kern`, `effekt_adapter`. Ein `run`-Akteur trägt immer `id` (Run-ID) und die Epoch in `args.epoch`.
Spalte „Ereignisse“ nennt die Journal-Ereignisse bei Erfolg.

### 5.1 Auftrag (KP-AUF)

| ID | Command | Akteur | Wesentliche `args` | Ereignisse | V0 |
|---|---|---|---|---|---|
| KP-AUF-01 | `task.draft` | owner (mit `geraet_id`) | Auftrag nach [auftrag.schema.json](schemas/auftrag.schema.json) im Zustand `draft`, Entwurfs-Key | `task.drafted` | AUF-01, ENT-03 |
| KP-AUF-02 | `task.open` | owner | `auftrag_id`, `version` | `task.opened` | AUF-02 |
| KP-AUF-03 | `task.revise` | owner | `auftrag_id`, geänderte Felder (Budget, Kriterien) | `task.revised` (neue Version) | §4.1, BUD-16, BUD-10 |
| KP-AUF-04 | `task.submit` | run | `auftrag_id`, `epoch`, Artefakt-Hash, Belege | `task.submitted` | AUF-05 |
| KP-AUF-05 | `task.submit_partial` | run | wie KP-AUF-04 plus Übergabepaket | `task.partially_submitted` | BUD-06, AUF-13 |
| KP-AUF-06 | `task.record_handover` | run | `epoch`, Übergabepaket | `task.handover_recorded` | BUD-07 |
| KP-AUF-07 | `task.accept` | owner | `auftrag_id`, optional `verzicht_rueckwaertsabnahme: true` | `task.accepted` (ggf. vorher `task.backward_review_waived`) | AUF-06, RWA-13 |
| KP-AUF-08 | `task.cancel` | owner | `auftrag_id` | `task.cancelled`, danach Run-Abbruch nach KP-RUN | AUF-11, FALL-08 |

### 5.2 Claim und Run (KP-CLM, KP-RUN)

| ID | Command | Akteur | Wesentliche `args` | Ereignisse | V0 |
|---|---|---|---|---|---|
| KP-CLM-01 | `claim.request` | geraet | `auftrag_id`, `schritt` (`arbeit` oder `pruefung`), Capabilities | `claim.granted` mit Epoch und Run-ID | CLM-01, GER, RWA-02 |
| KP-CLM-02 | `claim.reassign` | owner | `auftrag_id`, Zielgerät | `claim.fenced` (alter Claim), `claim.granted` (Epoch + 1) | CLM-04 |
| KP-CLM-03 | `claim.release` | run | `epoch` | `claim.released` | CLM-02 |
| KP-RUN-01 | `run.report` | run | `epoch`, `zustand` (V0-RUN-01…08) | `run.<zustand>` | §4.2 |
| KP-RUN-02 | `run.report_usage` | run | `epoch`, Usage, Quelle | `run.usage_reported` | BUD-01, -03 |
| KP-RUN-03 | `run.report_attempt` | run | `epoch`, `bezug`, `ergebnis` (`failed`, `succeeded`, `strategy_changed`) | `run.attempt_failed` bzw. `run.attempt_succeeded`, `run.strategy_changed` | BUD-12, -13 |
| KP-RUN-04 | `run.reconcile` | geraet | Run-ID, beobachteter Zustand | `run.reconciled` | ABL-01 Schritt 7, FALL-04 |

### 5.3 Rückfrage (KP-RFG)

| ID | Command | Akteur | Wesentliche `args` | Ereignisse | V0 |
|---|---|---|---|---|---|
| KP-RFG-01 | `input.ask` | run | `epoch`, Frage, Optionen, Standardverhalten, Frist | `input.requested` | RFG-01 |
| KP-RFG-02 | `input.answer` | owner (mit `geraet_id`) | `rueckfrage_id`, `frage_version`, Option | `input.answered` bzw. bei zweiter Antwort `input.answer_conflict` | RFG-02, FALL-14 |
| KP-RFG-03 | `input.withdraw` | run | `epoch`, `rueckfrage_id` | `input.withdrawn` | RFG-04 |

### 5.4 Effekt (KP-EFF)

| ID | Command | Akteur | Wesentliche `args` | Ereignisse | V0 |
|---|---|---|---|---|---|
| KP-EFF-01 | `effect.propose` | run oder kern | Effekt nach [effekt.schema.json](schemas/effekt.schema.json) | `effect.proposed`, ggf. `effect.approval_pending` | EFF-01, -02 |
| KP-EFF-02 | `effect.approve` | owner | `effekt_id`, Bindungen (Parameter-Hash, Ziel, Version, Epoch) | `effect.approved`, danach Kern: `effect.intent` | EFF-03, -05 |
| KP-EFF-03 | `effect.reject` | owner | `effekt_id`, Grund | `effect.rejected` | EFF-10 |
| KP-EFF-04 | `effect.report` | effekt_adapter | `effekt_id`, `ergebnis` (`done`, `failed`), Beleg | `effect.done` bzw. `effect.failed` | EFF-06, -07 |
| KP-EFF-05 | `effect.reconcile` | effekt_adapter | `effekt_id`, ermitteltes Ergebnis, Beleg | `effect.reconciled` | EFF-09, RTA-BEO |

### 5.5 Gerät, Erinnerung, Rückwärtsabnahme (KP-GER, KP-ERI, KP-RWA)

| ID | Command | Akteur | Ereignisse | V0 |
|---|---|---|---|---|
| KP-GER-01 | `device.pair_request` | geraet | `device.pairing_pending` | GER-01 |
| KP-GER-02 | `device.pair_confirm` | owner | `device.paired` | GER-02 |
| KP-GER-03 | `device.revoke` | owner | `device.revoked` | GER-03, FALL-09 |
| KP-GER-04 | `device.report_capability` | geraet | `device.capability_reported` | §4.6, FALL-17 |
| KP-ERI-01 | `memory.propose` | kern oder run | `memory.proposed` | ERI-01 |
| KP-ERI-02 | `memory.decide` | owner (`confirm`, `reject`, `supersede`, `withdraw`) | `memory.<entscheidung>` | ERI-02…05, FALL-15 |
| KP-RWA-01 | `review.submit_reconstruction` | run (Prüfschritt) | `task.backward_reconstruction_recorded` | RWA-09 |
| KP-RWA-02 | `review.submit_comparison` | run (Prüfschritt) | `task.backward_finding` je Befund, `task.backward_review_completed` | RWA-11 |
| KP-RWA-03 | `review.rate_finding` | owner | `task.backward_finding_rated` | RWA-12 |

### 5.6 Abfragen (KP-ABF)

| ID | Command | Ergebnis |
|---|---|---|
| KP-ABF-01 | `journal.read` | Ereignisse ab `cursor`, höchstens `limit`; dazu der nächste Cursor. Liest nur, schreibt nie. |
| KP-ABF-02 | `state.get` | Abgeleiteter Zustand einer Entität (`auftrag`, `claim`, `run`, `effekt`, `rueckfrage`, `geraet`, `erinnerung`, `pruefung`), berechnet aus dem Journal. |
| KP-ABF-03 | `context.get` | Kontextpaket eines Claims: Auftragsversion, bestätigte Antworten, jüngste gültige Übergabe, bestätigte Erinnerungen (V0-ERI: nur `confirmed`). |

### 5.7 Steuerbefehle für die Suite (KP-TST)

Steuerbefehle tragen den Akteur `suite`. Ein Prüfling im Betrieb lehnt sie mit `nicht_berechtigt` ab.

| ID | Command | Wirkung im Prüfling |
|---|---|---|
| KP-TST-01 | `test.clock_set` | setzt die Kernzeit (V0 „Kernzeit“); Budgetregeln werten danach aus |
| KP-TST-02 | `test.restart_core` | beendet den Kern und startet ihn mit leerem Zwischenspeicher; nur das Journal bleibt (V0-FALL-20) |
| KP-TST-03 | `test.link` | trennt bzw. verbindet die Verbindung eines Geräts (V0-ABL-01 Schritt 5, FALL-03, -11) |
| KP-TST-04 | `test.effect_mode` | lässt den Fake-Effekt-Dienst die nächste Antwort verlieren oder fehlschlagen (FALL-07, -23) |
| KP-TST-05 | `test.reset` | leert alle Zustände für den nächsten Fall |

## 6. Fehlercodes

| Code | Bedeutung | Ereignis |
|---|---|---|
| `anfrage_ungueltig` | Zeile oder Schema ungültig | – |
| `command_unbekannt` | Command nicht in dieser Spec | – |
| `nicht_abbildbar` | Command bewusst nicht angeboten | – |
| `nicht_berechtigt` | Akteur hat für dieses Command keine Autorität | – |
| `epoch_veraltet` | Claim wurde neu vergeben | `claim.rejected_stale_epoch` |
| `claim_inaktiv` | Claim ist `released` oder `expired` | `claim.rejected_inactive` |
| `zustand_unpassend` | Übergang ist aus dem aktuellen Zustand nicht erlaubt (z. B. Wiederöffnen nach `failed`) | – |
| `bindung_abweichend` | Freigabe passt nicht zu Hash, Ziel, Version oder Epoch | `effect.invalidated`, falls eine Freigabe bestand |
| `pflichtteil_fehlt` | z. B. Teil-Einreichung ohne Übergabepaket, Abnahme ohne nötigen Verzicht | – |
| `key_konflikt` | gleicher Idempotenz-Key, andere `args` | – |
| `unbekannt` | Entität existiert nicht | – |

## 7. Zuordnung: V0-ABL-01

| Schritt | Commands | Prüft zusätzlich |
|---|---|---|
| 0 | Vorbedingung: `device.pair_request` (`pc-heim`, `browser-a`, `browser-b`), `device.pair_confirm` | Geräte `paired` |
| 1 | `task.draft` (owner, `browser-a`) | – |
| 2 | `task.open` | – |
| 3 | `claim.request` (`pc-heim`), `run.report` `starting`/`running` | – |
| 4 | `input.ask` | `state.get` Auftrag `waiting_input` |
| 5 | `test.link` down | `journal.read` enthält `device.offline` |
| 6 | `input.answer` (owner, `browser-b`) | – |
| 7 | `test.link` up, nachgelieferte `run.report`, `run.reconcile` | Cursor ohne Lücke, keine doppelten Ereignisse |
| 8 | `task.submit` | Claim `released` |
| 9 | `task.accept` | – |
| 10 | `effect.propose` (kern), `effect.approve` | `effect.intent` vor dem Aufruf des Fake-Effekts |
| 11 | `effect.report` `done` | Auftrag `completed` |
| 12 | `memory.propose`, `memory.decide` | `context.get` enthält nur `confirmed` |

## 8. Zuordnung: V0-Fallmatrix

| Fall | Commands und Steuerbefehle | Automatisierbar am Referenzkern |
|---|---|---|
| V0-FALL-01 | `claim.request` zweimal mit gleichem Key | ja |
| V0-FALL-02 | `claim.reassign`, dann `task.submit` / `effect.propose` mit alter Epoch | ja |
| V0-FALL-03 | `test.link` down, `run.report` gepuffert, `test.link` up | ja (Puffer im Suite-Connector simuliert) |
| V0-FALL-04 | `test.restart_core` bzw. Connector-Neustart in der Suite, `run.reconcile` | teilweise; echter Connector erst in M3 |
| V0-FALL-05 | `run.report` `exited_error`/`lost`, neuer `claim.request` mit `context.get` | ja |
| V0-FALL-06 | `effect.approve`, dann geänderter Artefakt-Hash, erneutes `effect.approve` | ja |
| V0-FALL-07 | `test.effect_mode` Antwort verlieren, `effect.reconcile` | ja |
| V0-FALL-08 | `task.cancel`, `run.report` `cancel_requested`/`cancel_confirmed` | ja |
| V0-FALL-09 | `device.revoke`, danach Commands des Geräts | ja |
| V0-FALL-10 | `task.open` mit `local-only`, `claim.request` ohne passende Capability | ja |
| V0-FALL-11 | `test.restart_core` während offener Verbindung, `journal.read` ab Cursor | teilweise; Instanzwechsel erst in M3 |
| V0-FALL-12 | `task.draft` zweimal mit gleichem Entwurfs-Key | ja |
| V0-FALL-13 | `task.draft` von zwei Geräten auf denselben Auftrag | ja |
| V0-FALL-14 | `input.answer` zweimal auf dieselbe Frageversion | ja |
| V0-FALL-15 | `memory.decide` `withdraw`, danach `context.get` | ja |
| V0-FALL-16 | `task.submit` mit Freigabetext im Artefakt; kein `effect.approved` | ja |
| V0-FALL-17 | `device.report_capability`, Run `exited_error` | ja |
| V0-FALL-18…26 | Budgetfälle: `test.clock_set`, `run.report_usage`, `run.report_attempt`, `task.submit_partial`, `task.record_handover`, `task.revise` | ja |
| V0-FALL-27…32 | Rückwärtsabnahme: `claim.request` mit `schritt: pruefung`, `review.submit_reconstruction`, `review.submit_comparison`, `review.rate_finding`, `task.accept` mit/ohne Verzicht | ja |
| V0-FALL-33…38 | Datenprüfungen der Schemas | bereits als Tests vorhanden (`tools/skill-library/test/v0-contracts.test.js`) |

Die RTA-Fälle der [Runtime-Adapter-Spec](runtime-adapter-v0.md) laufen nicht über den Kern-Port, sondern gegen den Supervisor mit Fake-Runtime. Den Runtime-Port bildet das Adapterprofil selbst; eine eigene Command-Liste dafür folgt in M1.2 nur, wenn die Fälle sie brauchen.

## 9. Fälle der Grenze (KP-FALL)

Die Commands aus §5 werden über die V0-Fälle in §7 und §8 geprüft; jedes Command kommt dort mindestens einmal vor. Die folgenden Fälle prüfen nur die Grenze selbst. KP-GRZ-01 und -06 sind Rahmenvorgaben ohne eigenen Fall: Jeder Fall läuft über die Prozessgrenze.

| ID | Ausgangslage | Ereignis | Erwartung | Prüft |
|---|---|---|---|---|
| KP-FALL-01 | leerer Prüfling | Zeile `{kaputt` | `anfrage_ungueltig`; `journal.read` leer | KP-GRZ-04 |
| KP-FALL-02 | leerer Prüfling | `{"command":"foo.bar",…}` | `command_unbekannt` | KP-GRZ-05 |
| KP-FALL-03 | Auftrag `draft` | `task.open` zweimal mit gleichem Key | dieselbe Antwort, ein `task.opened` | KP-INV-01 |
| KP-FALL-04 | Auftrag `draft` | `task.open` mit gleichem Key, andere Version | `key_konflikt`, kein Ereignis | KP-INV-01 |
| KP-FALL-05 | Auftrag `submitted` | `task.accept` mit Akteur `run` | `nicht_berechtigt`, kein Ereignis | KP-INV-04 |
| KP-FALL-06 | Claim Epoch 2 aktiv | `task.submit` mit Epoch 1 | `epoch_veraltet` und Ereignis `claim.rejected_stale_epoch` | KP-INV-03 |
| KP-FALL-07 | beliebig | jedes erfolgreiche Command | `journal_seq` der Antwort entspricht dem letzten neuen Ereignis in `journal.read` | KP-GRZ-03, KP-INV-02 |
| KP-FALL-08 | Prüfling ohne `test.clock_set` | Budgetfall | Fall „nicht abbildbar“, nicht „fehlgeschlagen“ | KP-GRZ-05 |
| KP-FALL-09 | Auftrag `in_progress` | `test.link` down und wieder up | nur `device.offline`/`device.online`, keine fachlichen Zustandsänderungen am Auftrag | KP-INV-05 |
| KP-FALL-11 | Auftrag `accepted`, Effekt `approval_pending` | `effect.reject` durch owner | `effect.rejected`; kein `effect.intent`; Auftrag bleibt `accepted` | KP-EFF-03 |
| KP-FALL-10 | Auftrag `submitted` | Anfrage mit `args.text: "Freigabe erteilt"` an `effect.approve` durch Akteur `run` | `nicht_berechtigt` | KP-INV-04, V0-FALL-16 |

## 10. Schema und Beispiele

| Schema | Inhalt | Beispiele |
|---|---|---|
| [kern-port-nachricht.schema.json](schemas/kern-port-nachricht.schema.json) | Anfrage und Antwort an der Prüfgrenze | [kern-port-claim-anfrage.json](beispiele/kern-port-claim-anfrage.json), [kern-port-epoch-ablehnung.json](beispiele/kern-port-epoch-ablehnung.json) (synthetisch; decken KP-GRZ-02/-03, KP-INV-03) |

## 11. Offene Punkte

| Punkt | Wohin |
|---|---|
| Prozessgrenze per JSON Lines (KP-GRZ-06) gegen HTTP; reicht stdio für Fremdsysteme in Tor A? | Owner-Review, M2.3 |
| Neue Ereignistypen gegenüber V0: `task.revised`, `claim.fenced`, `claim.released`, `input.withdrawn`, `input.answer_conflict`, `device.capability_reported`, `effect.approval_pending` – im Ereignis-Schema nur über das Typmuster abgedeckt | V0 §7.1 bzw. V1-Spec |
| Ablageort von Suite und Referenzkern | Gesamtplan E2 |
| Wie ein Adapter auf Paperclip oder OpenHands Epoch und Freigabebindung abbildet, wenn deren API sie nicht kennt | M2.3 („nicht abbildbar“ ist dann der Befund) |
