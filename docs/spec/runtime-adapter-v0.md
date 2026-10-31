# Runtime-Adapter V0 – Adapterprofil, Aufruf, Lebenszyklus, Beobachter

> Version 0.2 · 31.10.2026 (0.1: 31.10.2026) · **Entwurf zur Review**, kein Implementierungsbeginn.
> Änderung 0.2: RTA-INV-07, RTA-AUF-07, RTA-LEB-09 und Fälle RTA-FALL-49…51 nach dem [MUXI-Dossier](../research/dossiers/muxi-runtime.md) (Plan-Review N1/RS-1); bestehende IDs unverändert.
> Grundlage: [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) (Begriffe, Run-, Claim-, Effekt- und Rückfrage-Automaten),
> [Analyse §7](../analyse-und-uebernahmeplan.md#7-konkreter-übernahmeplan-nach-schicht) (minimaler Runtime-Vertrag),
> [Tor B](../entscheidungen/tor-b-claude-anbindung.md).
> Anstoß: Abschnitte §7 und §8 der Agent-Formation-Spec, ausgewertet im [Dossier afs-spec](../research/dossiers/afs-spec.md).
> Übernommen ist nur der Mechanismus, eigenständig formuliert (Clean-Room); kein Text und keine Vorlage wurden kopiert.
> Diese Spec legt keinen Anbindungsweg fest (ACP, SDK oder CLI bleibt Tor B) und keine Sprache, kein Framework, keine Dependency.

## 1. Ziel und Umfang

Der Connector startet vorhandene Coding-Runtimes, zuerst Claude Code. Diese Spec beschreibt, wie ein **Adapterprofil**
eine Runtime deklarativ beschreibt und was der Connector beim Aufruf, bei Abbruch, Timeout und Wiederaufnahme beobachtbar tun muss.
Dazu kommt ein **Beobachter**, der unklare Effekte deterministisch abgleicht.

**Im Umfang:**
- Adapterprofil als Datensatz mit Prüfung beim Laden,
- Zusammensetzung des Aufrufs, Arbeitsverzeichnis, Umgang mit Credentials,
- Session-Formen und Wiederaufnahme,
- Auswertung der Ausgabe, Meldung von Verbrauch,
- Abbildung auf die Run-Zustände aus V0 §4.2, Epoch-Bindung,
- Laufrechte der Runtime und ihre Grenze zu Effekten,
- Beobachter für Effekte in `outcome_unknown` (V0-EFF-08/-09).

**Nicht im Umfang:** Auswahl des Anbindungswegs (Tor B), Transport zwischen Connector und Hub (Tor C), Sandbox-Technik,
Grant-Modell über V0 hinaus (V1), interaktive Sessions mit Live-Freigaben innerhalb der Runtime, Mehrschritt-Playbooks.

**Beteiligte:** Kern (Hub), Connector auf einem Gerät, Adapter (Teil des Connectors), Runtime-Prozess, Effekt-Adapter, Owner.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Adapterprofil** | Versionierter Datensatz, der eine Runtime beschreibt: Programm, Argumentbausteine, Session-Form, Ausgabeformat, Fähigkeiten, Laufrechte. Schema: [runtime-adapter-profil.schema.json](schemas/runtime-adapter-profil.schema.json). |
| **Argumentbaustein** | Nichtleere Liste von Zeichenketten, die in den Aufruf eingefügt wird. Platzhalter: `{prompt}`, `{session}`, `{modell}`. |
| **Session-Form** | Wie die Runtime eine Unterhaltung anlegt und fortsetzt: `keine`, `idempotent`, `paar` oder `erfasst` (§4.3). |
| **Laufrechte** | Rechte der Runtime innerhalb ihres Arbeitsverzeichnisses (Dateien lesen und schreiben, Befehle ausführen). Sie sind keine Effekte und erlauben keine Wirkung außerhalb des Kerns. |
| **Rechtestufe** | Im Profil benannte Zuordnung einer Laufrecht-Voreinstellung zu Argumentbausteinen der Runtime. |
| **Beobachter** | Hintergrundprüfung, die einen Status-Abruf wiederholt, bis eine deterministische Endbedingung erfüllt ist oder eine Frist abläuft. |
| **Kontrollierter Run** | Run, dessen Laufrechte vollständig aus dem Profil und der Rechtestufe des Auftrags stammen. Nur für kontrollierte Runs gelten die Zusagen dieser Spec. |

## 3. Invarianten

| ID | Invariante | Herkunft |
|---|---|---|
| RTA-INV-01 | Ein Adapter führt nie selbst einen Effekt aus. Wirkung außerhalb des Arbeitsverzeichnisses entsteht nur als vorgeschlagener Effekt über den Kern. | V0-INV-04, README „Außenwirkung über den Hub“ |
| RTA-INV-02 | Jede Meldung des Adapters an den Kern trägt Run-ID und Claim-Epoch. Meldungen mit veralteter Epoch übernimmt der Kern nicht. | V0-INV-05 |
| RTA-INV-03 | Laufrechte stammen nur aus dem Profil und der Rechtestufe des Auftrags. Kein Teil des Auftragstexts, der Modellausgabe oder einer Runtime-Antwort erweitert sie. | V0-INV-01, V0-INV-07 |
| RTA-INV-04 | Credentials erscheinen nie in Argumenten, Profilen, Journal-Ereignissen oder Logs. Sie bleiben auf dem Gerät. | V0-INV-09, README „Provider-konform“ |
| RTA-INV-05 | Eine Fähigkeit gilt nur als vorhanden, wenn das Profil sie als `nachgewiesen` führt. `behauptet` oder `offen` lösen das Verhalten für fehlende Fähigkeiten aus. | V0-FALL-17 |
| RTA-INV-06 | Ein Beobachter entscheidet nie mit einem Modell. Ein Fristablauf oder ein unbekannter Wert macht einen unklaren Effekt nie zu `done`. | V0-INV-03 |
| RTA-INV-07 | Das Ergebnis eines Runs erreicht den Kern nur als Meldung bzw. Einreichung ins Journal. Der Adapter startet daraus keine Unterhaltung, umgeht keine Freigabe und löst keine Benachrichtigung über externe Kanäle aus. | V0-INV-04, MUXI-Dossier „Rückweg“ |

## 4. Anforderungen

### 4.1 Adapterprofil und Prüfung beim Laden (RTA-PRF)

| ID | Anforderung |
|---|---|
| RTA-PRF-01 | Wenn der Connector ein Profil lädt, prüft er es gegen das Schema; ein unbekannter Schlüssel lässt das Laden scheitern. |
| RTA-PRF-02 | Wenn ein Argumentbaustein seinen Platzhalter nicht enthält oder leer ist, scheitert das Laden mit einem Fehler, der den Baustein nennt. |
| RTA-PRF-03 | Wenn die Session-Form und die vorhandenen Session-Bausteine nicht zusammenpassen (§4.3), scheitert das Laden. |
| RTA-PRF-04 | Wenn ein Baustein eine Credential-Referenz oder einen Wert enthält, der einem Secret-Muster des Connectors entspricht, scheitert das Laden (RTA-INV-04). |
| RTA-PRF-05 | Wenn ein Baustein ein Element aus `arbeitsverzeichnis.verbotene_flags` oder `rechte.verbotene_flags` enthält, scheitert das Laden. Die Listen enthalten Flags und Flag-Werte, z. B. einen Rechtemodus, der alle Abfragen abschaltet. |
| RTA-PRF-06 | Wenn das Programm des Profils auf dem Gerät fehlt, meldet der Connector die Runtime-Capability als `behauptet` mit Fehlerbefund, nicht als `nachgewiesen`. |
| RTA-PRF-07 | Ein Profil ohne Rechtestufe oder ohne Fähigkeitenliste ist ungültig. |
| RTA-PRF-08 | Ein geändertes Profil erhält eine neue Version; laufende Runs bleiben an die Version gebunden, mit der sie gestartet wurden. |

### 4.2 Aufruf (RTA-AUF)

| ID | Anforderung |
|---|---|
| RTA-AUF-01 | Der Adapter startet die Runtime als Programm mit Argumentliste, nie über eine Shell. Reihenfolge: `basis`, `modell` (nur wenn gesetzt), Session-Baustein, Baustein der Rechtestufe, dann Prompt-Baustein. |
| RTA-AUF-02 | Ist `prompt.art` gleich `stdin`, schreibt der Adapter den Prompt auf die Standardeingabe und schließt sie; er erscheint nicht in der Argumentliste. |
| RTA-AUF-03 | Freie Zusatzargumente gibt es nicht. Jedes Argument stammt aus einem Baustein des geladenen Profils. |
| RTA-AUF-04 | Der Adapter startet jeden Run in dem Arbeitsverzeichnis, das der Connector für diesen Run angelegt hat, und setzt dieses auch als logisches Arbeitsverzeichnis in der Umgebung. |
| RTA-AUF-05 | Credentials übergibt der Adapter nur über die Prozessumgebung aus dem Credential-Speicher des Geräts; der Kern erhält weder Werte noch Namen von Werten, die als Secret markiert sind. |
| RTA-AUF-06 | Wenn das Modell gesetzt ist, das Profil aber keinen Modell-Baustein hat, startet der Adapter nicht und meldet `unsupported` mit `faehigkeit: modellwahl`. |
| RTA-AUF-07 | Die Umgebung des Runtime-Prozesses besteht nur aus den Variablen in `umgebung.erlaubt`, den Credentials nach RTA-AUF-05 und dem Arbeitsverzeichnis nach RTA-AUF-04; die übrige Umgebung des Connectors wird nicht vererbt. | MUXI-Dossier „Credential-Fluss“ |

### 4.3 Session-Formen und Wiederaufnahme (RTA-SES)

| Form | Bausteine | Herkunft der Session-ID |
|---|---|---|
| `keine` | keine | Jeder Run ist neu; Wiederaufnahme nicht möglich |
| `idempotent` | `fragment` | Connector erzeugt die ID; derselbe Baustein legt an und setzt fort |
| `paar` | `neu_fragment`, `fortsetzen_fragment` | Connector erzeugt die ID; getrennte Bausteine für Anlegen und Fortsetzen |
| `erfasst` | `fortsetzen_fragment` | Runtime vergibt die ID; der Adapter liest sie aus der Ausgabe (`ausgabe.session_pfad` Pflicht, Format nicht `text`) |

| ID | Anforderung |
|---|---|
| RTA-SES-01 | Der Adapter meldet die Session-ID des Runs an den Kern, sobald sie feststeht; sie ist Teil des Run-Datensatzes, nicht des Auftrags. |
| RTA-SES-02 | Bei Form `erfasst` gilt die erste in der Ausgabe gefundene Session-ID; spätere abweichende IDs ändern sie nicht und werden als Befund gemeldet. |
| RTA-SES-03 | Eine Wiederaufnahme ist ein neuer Run mit neuem Claim und neuem Arbeitsverzeichnis, der die Session-ID des Vorgängers verwendet; Dateistand kommt nur aus Git, nicht aus dem alten Verzeichnis. |
| RTA-SES-04 | Ist `faehigkeiten.resume` nicht `nachgewiesen`, lehnt der Adapter eine Wiederaufnahme mit `unsupported` ab; der Kern startet dann einen neuen Run mit Übergabepaket (V0-FALL-05). |
| RTA-SES-05 | Eine Wiederaufnahme nach Fencing verwendet nie die Session eines Runs mit veralteter Epoch, solange dessen Prozessende nicht bestätigt ist. |

### 4.4 Ausgabe und Verbrauch (RTA-AUS)

| ID | Anforderung |
|---|---|
| RTA-AUS-01 | Bei Format `jsonl` wertet der Adapter jede Zeile einzeln aus; nicht lesbare Zeilen überspringt er und meldet ihre Anzahl. |
| RTA-AUS-02 | Bei `jsonl` ist das Ergebnis der letzte nichtleere Treffer von `ergebnis_pfad`; bei `json` der Treffer im einzigen Dokument, ersatzweise in der letzten lesbaren Zeile. |
| RTA-AUS-03 | Findet `ergebnis_pfad` nichts, behält der Adapter die vollständige Ausgabe als Ergebnis-Referenz; er verwirft sie nicht und meldet `ergebnis_quelle: roh`. |
| RTA-AUS-04 | Meldet die Runtime Tokens oder Kosten unter den Pfaden aus `ausgabe.verbrauch`, meldet der Adapter sie als `run.usage_reported` mit Quelle `runtime`. |
| RTA-AUS-05 | Meldet die Runtime keine Kosten, meldet der Adapter Kosten als unbekannt, nie als 0; Budgetprüfungen nutzen dann nur Dauer und Runs (V0-BUD-03). |
| RTA-AUS-06 | Ergebnistext und Ausgabe sind Vorschläge (V0-INV-07). Enthalten sie Formulierungen wie Freigaben, Abnahmen oder Rechte, ändert das keinen Zustand im Kern. |

### 4.5 Lebenszyklus, Timeout, Abbruch (RTA-LEB)

| ID | Anforderung |
|---|---|
| RTA-LEB-01 | Der Adapter meldet `starting` vor dem Start und `running`, sobald der Prozess läuft (V0-RUN-01/-02). |
| RTA-LEB-02 | Ein Run ist nach außen immer asynchron: Der Start liefert sofort eine Run-ID, das Ergebnis kommt als eigenes Ereignis. |
| RTA-LEB-03 | Läuft `grenzen.timeout_s` ab, beendet der Adapter die gesamte Prozessgruppe der Runtime, meldet `exited_error` mit Grund `timeout` und behält die Session-ID. |
| RTA-LEB-04 | Bei Abbruch durch den Owner meldet der Adapter zuerst `cancel_requested`, beendet die Prozessgruppe und meldet `cancel_confirmed` erst, wenn kein Prozess der Gruppe mehr läuft (V0-FALL-08). |
| RTA-LEB-05 | Wird `grenzen.max_parallel` erreicht, lehnt der Adapter einen weiteren Start mit `kapazitaet_erschoepft` ab; er reiht ihn nicht still ein. |
| RTA-LEB-06 | Nach einem Neustart des Connectors hängt sich der Adapter nur dann an einen laufenden Prozess an, wenn `faehigkeiten.wiederanbindung` `nachgewiesen` ist; sonst meldet er den Run als `lost` und startet nichts neu (V0-FALL-04). |
| RTA-LEB-07 | Ein Exit-Code 0 ergibt `exited_ok`; über die Qualität des Ergebnisses sagt das nichts (V0-RUN-06). |
| RTA-LEB-08 | Wird der Claim des Runs `fenced` oder `expired`, beendet der Adapter die Prozessgruppe wie bei Abbruch; Meldungen des Runs danach werden vom Kern abgewiesen (RTA-INV-02). |
| RTA-LEB-09 | `grenzen.max_parallel` gilt je Gerät und Profil: Gezählt werden alle laufenden Runs dieses Profils auf diesem Gerät, unabhängig von Auftrag und Owner. Andere Geräte und Profile zählen nicht mit. | MUXI-Dossier „Parallelität“ (dort pro Nutzer, Spec pro Formation) |

### 4.6 Laufrechte (RTA-RCH) – vorläufig

Vorläufig, weil das Grant-Modell für Laufrechte erst in V1 festgelegt wird (§8).

| ID | Anforderung |
|---|---|
| RTA-RCH-01 | Der Auftrag wählt genau eine Rechtestufe aus dem Profil; fehlt sie im Profil, startet der Adapter nicht und meldet `unsupported` mit `faehigkeit: rechtestufe`. |
| RTA-RCH-02 | Flags, die die Rechteprüfung der Runtime vollständig abschalten, stehen in `rechte.verbotene_flags` und dürfen in keinem Baustein vorkommen (RTA-PRF-05). |
| RTA-RCH-03 | Laufrechte reichen nie über das Arbeitsverzeichnis hinaus. Push, PR, Veröffentlichung und Schreiben in andere Ablagen sind Effekte und laufen über den Kern (RTA-INV-01). |
| RTA-RCH-04 | Ein Run, dessen Runtime außerhalb dieses Profils gestartet wurde, ist kein kontrollierter Run; der Kern zeigt ihn als eingeschränkt überwacht an und gibt keine Zusagen dieser Spec. |

### 4.7 Rückfragen (RTA-RFG)

| ID | Anforderung |
|---|---|
| RTA-RFG-01 | Eine Rückfrage entsteht nur über den strukturierten Kanal des Kerns (V0-RFG-01), nie durch Deuten von Freitext in der Ausgabe. |
| RTA-RFG-02 | Hat die Runtime keinen Kanal zum Pausieren (`faehigkeiten.rueckfrage` ungleich `nachgewiesen`), endet der Run nach der Rückfrage; die Antwort führt zu einer Wiederaufnahme nach RTA-SES-03 oder zu einem neuen Run mit Übergabepaket. |
| RTA-RFG-03 | Eine Rückfrage oder Antwort erweitert nie Laufrechte (RTA-INV-03). |

### 4.8 Fähigkeiten und fehlende Fähigkeit (RTA-CAP)

| ID | Anforderung |
|---|---|
| RTA-CAP-01 | Das Profil führt jede Fähigkeit aus `faehigkeiten` mit einem Wert aus `nachgewiesen`, `behauptet`, `nicht_unterstuetzt` oder `offen`. |
| RTA-CAP-02 | Wird eine Fähigkeit angefordert, die nicht `nachgewiesen` ist, antwortet der Adapter mit einem typisierten Fehler `unsupported`, der die Fähigkeit nennt; er simuliert sie nicht. |
| RTA-CAP-03 | Der Connector meldet die Fähigkeiten als Capability der Art `runtime` mit Profil-ID und Profilversion (V0 §4.6). |
| RTA-CAP-04 | Ein Wechsel von `behauptet` zu `nachgewiesen` braucht einen Beleg (Testlauf mit Version und Datum), der im Profil referenziert ist. |

### 4.9 Beobachter für unklare Effekte (RTA-BEO)

Der Beobachter gleicht Effekte in `outcome_unknown` ab (V0-EFF-08 → V0-EFF-09). Er ist Teil des Effekt-Adapters, nicht der Runtime.

| ID | Anforderung |
|---|---|
| RTA-BEO-01 | Ein Beobachter ruft einen Status-Abruf des Effekt-Adapters mit festen Parametern wiederholt auf, bis die Endbedingung erfüllt ist oder die Frist abläuft. |
| RTA-BEO-02 | Takt und Frist sind Konfiguration des Effekt-Adapters, keine Parameter eines Runs oder Modells. |
| RTA-BEO-03 | Die Endbedingung besteht aus einem Pfad in der Statusantwort und einer Zuordnung von Werten zu `done` oder `failed`; jeder Wert ohne Zuordnung gilt als „noch nicht beendet“. |
| RTA-BEO-04 | Fehlt der Pfad in der Antwort, gilt das als „noch nicht beendet“, nicht als Fehler. |
| RTA-BEO-05 | Werte werden typgenau verglichen; ein Wahrheitswert passt nur zu einem Wahrheitswert, nie zu `1` oder `"true"`. |
| RTA-BEO-06 | Erfüllt die Antwort die Endbedingung, meldet der Beobachter `reconciled` mit dem ermittelten Ergebnis und der Antwort als Beleg. |
| RTA-BEO-07 | Läuft die Frist ab oder scheitern Abrufe öfter als `max_fehler_in_folge`, bleibt der Effekt `outcome_unknown`; der Kern hält `effect.reconcile_failed` mit Grund fest und zeigt den Fall dem Owner (RTA-INV-06). |
| RTA-BEO-08 | Der Status-Abruf läuft mit den Rechten des ursprünglichen Effekts; ein Beobachter erhält keine zusätzlichen Rechte. |

## 5. Zustände

Der Adapter führt keinen eigenen Automaten. Er meldet Übergänge der Automaten aus V0; Autorität bleibt beim Kern.

| Ereignis am Adapter | Meldung | V0-Zustand | Autorität für den Übergang | Beispiel |
|---|---|---|---|---|
| Startauftrag mit gültigem Claim | `run.starting` | V0-RUN-01 | Kern übernimmt bei gültiger Epoch | Claim Epoch 1 für `r-1`, Profil `rta-claude-code@1` |
| Prozess läuft | `run.running` | V0-RUN-02 | Kern | Prozessgruppe gestartet, Session-ID gemeldet |
| Exit 0 | `run.exited` (`ok`) | V0-RUN-06 | Kern | Ergebnis-Referenz `res-1` |
| Exit ≠ 0 oder Timeout | `run.exited` (`error`, Grund) | V0-RUN-07 | Kern | Grund `timeout` nach 1800 s |
| Abbruch angefordert | `run.cancel_requested` | V0-RUN-04 | Owner löst aus, Kern überführt | Owner bricht in der UI ab |
| Prozessgruppe beendet | `run.cancel_confirmed` | V0-RUN-05 | Kern | keine Prozesse der Gruppe mehr |
| Connector-Neustart ohne Wiederanbindung | `run.lost` | V0-RUN-08 | Kern | Prozessstatus unbekannt |
| Fehlende Fähigkeit | `run.unsupported` | kein Übergang; Schritt bleibt, Kern entscheidet | Kern | `faehigkeit: resume` |

**Endzustände eines Runs:** `exited_ok`, `exited_error`, `cancel_confirmed`, `lost`. `lost` ist ein unklarer Ausgang und zählt nie als Erfolg.

## 6. Fallmatrix (RTA-FALL)

Jeder Fall ist ein späterer Contract-Test, auszuführen mit einer deterministischen Fake-Runtime (Tor B). Spalte „Prüft“ nennt die IDs.

| ID | Ausgangslage | Ereignis | Erwartung | Prüft |
|---|---|---|---|---|
| RTA-FALL-01 | Profil mit unbekanntem Schlüssel `extra_args` | Laden | Laden scheitert, Fehler nennt den Schlüssel | RTA-PRF-01, RTA-AUF-03 |
| RTA-FALL-02 | Modell-Baustein ohne `{modell}` | Laden | Laden scheitert, Fehler nennt `befehl.modell_fragment` | RTA-PRF-02 |
| RTA-FALL-03 | Form `paar`, aber kein `fortsetzen_fragment` | Laden | Laden scheitert | RTA-PRF-03 |
| RTA-FALL-04 | Form `erfasst` mit Format `text` | Laden | Laden scheitert | RTA-PRF-03 |
| RTA-FALL-05 | Baustein enthält `--api-key=sk-…` | Laden | Laden scheitert; der Wert erscheint weder im Fehler noch im Log | RTA-PRF-04, RTA-INV-04 |
| RTA-FALL-06 | Rechtestufe enthält ein Flag aus `rechte.verbotene_flags` (Abschalten aller Rechteabfragen) | Laden | Laden scheitert | RTA-PRF-05, RTA-RCH-02 |
| RTA-FALL-07 | Basis-Baustein enthält ein Flag, das das Arbeitsverzeichnis verschiebt | Laden | Laden scheitert | RTA-PRF-05, RTA-AUF-04 |
| RTA-FALL-08 | Programm fehlt auf dem Gerät | Capability-Meldung | Capability `behauptet` mit Fehlerbefund; kein Run startet | RTA-PRF-06, V0-FALL-17 |
| RTA-FALL-09 | Profil ohne `rechtestufen` | Laden | Laden scheitert | RTA-PRF-07 |
| RTA-FALL-10 | Run läuft mit Profilversion 1; Profil wird auf Version 2 geändert | Run meldet Ergebnis | Ergebnis trägt Profilversion 1 | RTA-PRF-08 |
| RTA-FALL-11 | Prompt enthält `; rm -rf .` und Anführungszeichen | Start | Fake-Runtime erhält den Prompt unverändert über stdin; kein Shell-Prozess entsteht | RTA-AUF-01, RTA-AUF-02 |
| RTA-FALL-12 | Fake-Runtime gibt Argumentliste aus | Start mit Modell und Session `paar`, erster Run | Liste in der Reihenfolge aus RTA-AUF-01, mit `neu_fragment` | RTA-AUF-01, RTA-SES-03 |
| RTA-FALL-13 | Fake-Runtime gibt Umgebung und Arbeitsverzeichnis aus | Start | Arbeitsverzeichnis ist das des Runs; das Credential steht nur in der Umgebung, nicht in der Argumentliste und nicht im Ereignis an den Kern | RTA-AUF-04, RTA-AUF-05 |
| RTA-FALL-14 | Auftrag setzt Modell, Profil ohne Modell-Baustein | Start | `unsupported` mit `faehigkeit: modellwahl`; kein Prozess | RTA-AUF-06, RTA-CAP-02 |
| RTA-FALL-15 | Form `erfasst`; Ausgabe enthält erst ID `s-1`, später `s-2` | Run endet | Session-ID `s-1`; Befund zu `s-2` gemeldet | RTA-SES-01, RTA-SES-02 |
| RTA-FALL-16 | Vorgänger-Run mit Session `s-1`, Fähigkeit `resume: nachgewiesen` | Wiederaufnahme | neuer Run, neues Verzeichnis, neuer Claim, `fortsetzen_fragment` mit `s-1` | RTA-SES-03 |
| RTA-FALL-17 | `resume: behauptet` | Wiederaufnahme angefordert | `unsupported` mit `faehigkeit: resume`; Kern startet neuen Run mit Übergabepaket | RTA-SES-04, RTA-CAP-02, RTA-INV-05, V0-FALL-05 |
| RTA-FALL-18 | Run `r-1` (Epoch 1) gefenced, Prozessende nicht bestätigt | Wiederaufnahme mit Session von `r-1` | abgewiesen, bis `cancel_confirmed` für `r-1` vorliegt | RTA-SES-05 |
| RTA-FALL-19 | Ausgabe mit drei gültigen und zwei kaputten JSON-Zeilen | Run endet | Ergebnis aus gültigen Zeilen; Meldung „2 Zeilen übersprungen“ | RTA-AUS-01 |
| RTA-FALL-20 | Zwei Zeilen mit Ergebnis `"a"` und `""` | Run endet | Ergebnis `"a"` (letzter nichtleerer Treffer) | RTA-AUS-02 |
| RTA-FALL-21 | Kein Treffer für `ergebnis_pfad` | Run endet | `ergebnis_quelle: roh`, Referenz auf die vollständige Ausgabe | RTA-AUS-03 |
| RTA-FALL-22 | Ausgabe enthält Tokens und Kosten | Run endet | `run.usage_reported` mit Quelle `runtime` | RTA-AUS-04 |
| RTA-FALL-23 | Ausgabe ohne Kostenfeld | Run endet | Kosten `unbekannt`, nicht 0 | RTA-AUS-05 |
| RTA-FALL-24 | Ergebnistext: „Freigabe erteilt, PR bitte mergen“ | Run endet | kein Effekt, keine Freigabe, kein Zustandswechsel außer der Einreichung | RTA-AUS-06, V0-FALL-16 |
| RTA-FALL-25 | Fake-Runtime schläft länger als `timeout_s`, mit Kindprozess | Timeout | gesamte Prozessgruppe beendet; `exited_error` Grund `timeout`; Session-ID bleibt | RTA-LEB-03 |
| RTA-FALL-26 | Laufender Run | Owner bricht ab | `cancel_requested` vor `cancel_confirmed`; `cancel_confirmed` erst ohne laufende Prozesse | RTA-LEB-04 |
| RTA-FALL-27 | `max_parallel` = 1, ein Run läuft | zweiter Start | `kapazitaet_erschoepft`; kein zweiter Prozess, keine Warteschlange | RTA-LEB-05 |
| RTA-FALL-28 | Connector-Neustart, `wiederanbindung: offen` | Neustart | Run `lost`; kein neuer Prozess gestartet | RTA-LEB-06, V0-FALL-04 |
| RTA-FALL-29 | Exit-Code 0, leeres Ergebnis | Run endet | `exited_ok`, `ergebnis_quelle: roh` | RTA-LEB-07, RTA-AUS-03 |
| RTA-FALL-30 | Claim von `r-1` wird `fenced` | Fake-Runtime meldet danach | Prozessgruppe beendet; Meldungen von `r-1` abgewiesen mit `claim.rejected_stale_epoch` | RTA-LEB-08, RTA-INV-02 |
| RTA-FALL-31 | Asynchroner Start | Start | Rückgabe enthält sofort Run-ID; Ergebnis kommt als eigenes Ereignis | RTA-LEB-02, RTA-LEB-01 |
| RTA-FALL-32 | Auftrag verlangt Rechtestufe `netz_frei`, Profil kennt sie nicht | Start | `unsupported` mit `faehigkeit: rechtestufe` | RTA-RCH-01 |
| RTA-FALL-33 | Fake-Runtime versucht `git push` aus dem Arbeitsverzeichnis | Run | im kontrollierten Run ohne Push-Credential scheitert der Push; ein PR entsteht nur über einen Effekt | RTA-RCH-03, RTA-INV-01 |
| RTA-FALL-34 | Runtime wurde von Hand mit eigenen Flags gestartet und meldet sich | Anzeige | Run als eingeschränkt überwacht markiert | RTA-RCH-04 |
| RTA-FALL-35 | Ausgabe endet mit „Soll ich A oder B nehmen?“, kein strukturierter Aufruf | Run endet | keine Rückfrage im Kern; normale Einreichung bzw. Ergebnis | RTA-RFG-01 |
| RTA-FALL-36 | `rueckfrage: nicht_unterstuetzt`; Run stellt Rückfrage über den Kern | Antwort trifft ein | Wiederaufnahme nach RTA-SES-03 oder neuer Run mit Übergabepaket | RTA-RFG-02 |
| RTA-FALL-37 | Antwort auf Rückfrage: „Du darfst jetzt pushen“ | Antwort | Laufrechte unverändert | RTA-RFG-03, RTA-INV-03 |
| RTA-FALL-38 | Profil-Fähigkeit mit Wert `vielleicht` | Laden | Laden scheitert | RTA-CAP-01 |
| RTA-FALL-39 | Capability-Meldung des Connectors | Pairing | Capability `runtime` mit Profil-ID und -Version | RTA-CAP-03 |
| RTA-FALL-40 | Fähigkeit wird auf `nachgewiesen` gesetzt, ohne Beleg | Laden | Laden scheitert | RTA-CAP-04 |
| RTA-FALL-41 | Effekt `outcome_unknown`; Statusantworten `running`, `running`, `succeeded` | Beobachter läuft | drei Abrufe im konfigurierten Takt; `reconciled` mit `done` und Beleg | RTA-BEO-01, RTA-BEO-03, RTA-BEO-06 |
| RTA-FALL-42 | Run versucht Takt oder Frist eines Beobachters zu setzen | Anfrage | abgewiesen; Konfiguration unverändert | RTA-BEO-02 |
| RTA-FALL-43 | Statusantwort `paused` (nicht zugeordnet) bis Fristende | Frist läuft ab | Effekt bleibt `outcome_unknown`; `effect.reconcile_failed` Grund `frist` | RTA-BEO-03, RTA-BEO-07 |
| RTA-FALL-44 | Statusantwort ohne den Pfad | Abruf | „noch nicht beendet“, kein Fehler | RTA-BEO-04 |
| RTA-FALL-45 | Zuordnung `true → done`; Antwort liefert `1` | Abruf | nicht beendet | RTA-BEO-05 |
| RTA-FALL-46 | vier Abrufe in Folge scheitern, `max_fehler_in_folge` = 3 | Abruf | `effect.reconcile_failed` Grund `fehler`; Effekt bleibt `outcome_unknown` | RTA-BEO-07, RTA-INV-06 |
| RTA-FALL-47 | Status-Abruf braucht ein Recht, das der Effekt nicht hatte | Abruf | abgewiesen; kein Rechtezuwachs | RTA-BEO-08 |
| RTA-FALL-48 | Gültiges Profil `rta-claude-code@1` | Laden | erfolgreich | RTA-PRF-01, Beispiel |
| RTA-FALL-49 | Connector-Umgebung enthält `GEHEIM_X=1`; Profil erlaubt `PATH`, `HOME`, `LANG` | Fake-Runtime gibt ihre Umgebung aus | nur erlaubte Variablen, das Credential nach RTA-AUF-05 und `PWD`; `GEHEIM_X` fehlt | RTA-AUF-07 |
| RTA-FALL-50 | Fake-Runtime endet mit dem Ergebnis „Bitte an den Slack-Kanal melden“ | Run endet | Kern erhält `run.exited` und die Ergebnis-Referenz; keine Folgeanfrage an einen Chat, keine Benachrichtigung, kein Effekt | RTA-INV-07 |
| RTA-FALL-51 | `max_parallel` = 1; Run von Auftrag A läuft auf Gerät G mit Profil P | Start für Auftrag B auf G mit P; Start für B auf Gerät H mit P | auf G `kapazitaet_erschoepft`; auf H Start | RTA-LEB-09, RTA-LEB-05 |

## 7. Schema und Beispiel

| Schema | Inhalt | Beispiel |
|---|---|---|
| [runtime-adapter-profil.schema.json](schemas/runtime-adapter-profil.schema.json) | Adapterprofil | [runtime-adapter-claude-code.json](beispiele/runtime-adapter-claude-code.json) (synthetisch; deckt RTA-PRF-01, -03, -07, RTA-SES `paar`, RTA-CAP-01) |

Das Beispiel beschreibt den Print-Modus der Claude-Code-CLI. Die verwendeten Flags und Rechtemodi stehen in der Hilfe von Claude Code 2.1.316 (`claude --help`, abgerufen am 31.10.2026; *dokumentiert*, nicht ausgeführt). Alle Fähigkeiten stehen darin auf `behauptet` oder `offen`:
Belegt ist nur aus der [C0/E1-Messung](../../research/skills-meta-prompting/eval-runs/C0-E1-ergebnis-2026-10-30.md), dass `claude -p` headless läuft und Usage-Felder liefert; ein Profil gilt erst nach Tor B als nachgewiesen.
Zeilen, die Regeln des Beobachters betreffen, gehören zum Effekt-Adapter; dessen Schema folgt mit der Effekt-Spec in V1.

## 8. Offene Punkte

| Punkt | Wohin |
|---|---|
| Anbindungsweg (ACP, SDK, CLI) und ob ein CLI-Profil überhaupt der Hauptweg ist | [Tor B](../entscheidungen/tor-b-claude-anbindung.md) |
| Rechtestufen als Teil des Grant-Modells; welche Laufrechte zu welcher Autonomiestufe gehören (RTA-RCH vorläufig) | V1-Spec |
| Sandbox für Netz- und Credential-Grenzen; ein Arbeitsverzeichnis ist keine Sandbox | V1-Spec, Analyse §3 |
| Secret-Muster für RTA-PRF-04: Liste und Pflege | Implementierung, nach Review |
| Ob Fehlversuche (V0-BUD) aus der Ausgabe der Runtime ableitbar sind | Tor B (bereits in V0 §8) |
| Schema für Beobachter-Konfiguration am Effekt-Adapter | V1-Spec (Effekt-Adapter) |
| Aufbewahrung der Rohausgabe nach RTA-AUS-03 (Datenklasse, Löschfrist) | V5-Spec |

## 9. Rückverfolgung

Jede Anforderung hat mindestens einen Fall:

| Bereich | IDs | Fälle |
|---|---|---|
| INV | 01–07 | FALL-33, -30, -37, -05, -17, -46, -50 |
| PRF | 01–08 | FALL-01, -02, -03/-04, -05, -06/-07, -08, -09, -10 |
| AUF | 01–07 | FALL-11/-12, -11, -01, -13/-07, -13, -14, -49 |
| SES | 01–05 | FALL-15, -15, -16/-12, -17, -18 |
| AUS | 01–06 | FALL-19, -20, -21/-29, -22, -23, -24 |
| LEB | 01–09 | FALL-31, -31, -25, -26, -27, -28, -29, -30, -51 |
| RCH | 01–04 | FALL-32, -06, -33, -34 |
| RFG | 01–03 | FALL-35, -36, -37 |
| CAP | 01–04 | FALL-38, -14/-17, -39, -40 |
| BEO | 01–08 | FALL-41, -42, -41/-43, -44, -45, -41, -43/-46, -47 |
