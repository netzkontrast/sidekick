# Befund vendor/libx

Frage und Zielverhalten: Taugt vendor/libx als Warteschlange für Hintergrundaufgaben (Export, Erinnerungen) in „Tafel“?
Entscheidend ist, wie sich libx nach einem Absturz verhält. Ob „genau einmal“ oder „mindestens einmal“ gefordert ist,
entscheidet der Owner (auftrag.md:4-5, offene Frage Q-20261030-delivery-semantics, unbeantwortet).

Quelle / gelesene Version / Prüfdatum: lokales Repo, Commit ac1af94 („c1“), Dateien `vendor/libx/README.md`, `vendor/libx/jobs.py`;
README nennt Version 2.3; geprüft 2026-10-30.

| # | Aussage | Quellenrolle | Fundstelle@SHA | Evidenzstufe |
|---|---|---|---|---|
| A1 | Aufgaben werden in SQLite gespeichert | Herstellerbehauptung | README.md:3@ac1af94 | dokumentiert (SQLite-Zugriff selbst nicht im Code gesehen) |
| A2 | Nach Absturz werden Aufgaben mit Status `running` erneut gestartet | Herstellerbehauptung + Code | README.md:7, jobs.py:1-3@ac1af94 | dokumentiert und im Code gefunden: `resume()` setzt alle `running`-Jobs auf `queued` |
| A3 | Eine vor dem Absturz bereits (teilweise) ausgeführte Aufgabe wird nochmals ausgeführt → Semantik **mindestens einmal**, nicht genau einmal | Code (Schluss) | jobs.py:2-3@ac1af94 | im Code gefunden (abgeleitet); nicht praktisch nachgewiesen |
| A4 | Keine Idempotenz-/Deduplizierungs- oder Fencing-Mechanik vorhanden | Code | Suchumfang s. u. | im Code gefunden (Abwesenheitsbefund) |
| A5 | Lizenz MIT | Herstellerbehauptung | README.md:4@ac1af94 | dokumentiert; keine LICENSE-Datei im Paket |
| A6 | Unklar: ob `resume()` atomar/in einer Transaktion läuft, wer es aufruft, wie Worker Jobs auf `running` setzen und abschließen | – | – | offen (Code nicht vorhanden) |

Suchumfang (A4, A5): Commit ac1af94, Pfad `vendor/libx/**` (genau 2 Dateien: README.md, jobs.py, beide vollständig gelesen);
gesucht nach Idempotenz-Schlüssel, Dedup, Lease/Epoch/Fencing, Abschlussmarkierung, LICENSE – nichts gefunden.

Lizenz/Herkunft je Bestandteil: Code (jobs.py) – laut README MIT, ohne LICENSE-Text und ohne Herkunftsangabe (Notice-Pflicht nicht erfüllbar, offen);
Beispiele/Daten/Prompttexte – keine vorhanden.

Ausfallverhalten (Integrationssicht): Zustandsbesitz liegt in der `jobs`-Tabelle; nach Absturz Neueinreihung aller `running`-Jobs.
Nebenwirkungen (Export-Datei, versandte Erinnerung) können dadurch doppelt auftreten.

Widerspruch zu vorhandenem Artefakt: `befund-fehlerhaft.md` behauptet „genau einmal“ und „produktionsreif, von vielen Teams genutzt“.
Ersteres widerspricht jobs.py:2-3; Letzteres ist durch keine Quelle im Repo belegt. Nicht als Beleg verwenden.

Schlussfolgerung und Grenzen: libx liefert nach Absturz bestenfalls „mindestens einmal“. Erfüllt das Anforderung (a) des Owners,
ist libx grundsätzlich brauchbar, sofern die Aufgaben idempotent sind. Für „genau einmal“ müsste Tafel Idempotenz selbst ergänzen.
Grenze: Nur zwei Dateien vorhanden; Worker-/Abschlusslogik und die SQLite-Schicht sind nicht einsehbar (A6).

Versuch: nicht ausgeführt. Kleinster Versuch wäre: Job auf `running` setzen, Prozess abbrechen, `resume()` aufrufen, Ausführungen zählen.
Voraussetzung fehlt – im Paket gibt es weder `db`-Implementierung noch Worker; Erwartung: Zählung 2.

Empfehlungskategorie (keine Entscheidung): **zurückstellen**, bis Q-20261030-delivery-semantics beantwortet ist.
Bei „mindestens einmal“ käme „Dependency nutzen“ in Frage (mit idempotenten Aufgaben, Lizenztext nachfordern);
bei „genau einmal“ reicht libx allein nicht.

Nächster Schritt / Blockade: Owner-Antwort auf Q-20261030-delivery-semantics; vollständige libx-Quellen (Worker, DB-Schicht, LICENSE) beschaffen.
