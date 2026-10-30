# Vision v5 – Machbarkeit, Quellen und offene Nachweise

> Stand: 30.10.2026 · Fertiger Recherchebericht, kein Implementierungsentscheid.
> Ziel: [Vision-Entwurf](../vision-v5-entwurf.md) und [Claude-Bauauftrag](../claude-startauftrag-vision-v5.md) auf belastbare Möglichkeiten begrenzen.
> Fokus: P0-Geräteverbindung, Laufzeitgrenzen, Agent-Verträge und früher Lernversuch. Weitere Fähigkeiten bleiben Kandidaten.

## Ergebnis und Evidenzgrenze

Die gewünschte Richtung ist als Zusammenspiel aus Offline-Webapp, Hub und lokalem Connector plausibel. Nicht nachgewiesen sind der Betrieb auf dem konkreten PC, deutsche Sprachqualität, Ende-zu-Ende-Ausfälle oder ein Lernerfolg auf Sidekick-Daten.

Untersucht wurden elf zusätzliche GitHub-Projekte an fixierten Commits, öffentliche Herstellerdokumentation sowie Selfplay und der bestehende Sidekick-Stand. Die Repo-Tabelle enthält **Dokumentenbefunde**, keine elf vollständigen Codeaudits oder ausgeführten Integrationen. Gezielt im Code gelesen wurden Needles Trainingsschleife und Selfplays Memory-Modul. Keine Fremdsoftware installiert, kein Modell trainiert, keine kostenpflichtige API verwendet.

## Ausgangslage in Sidekick

Gelesener Hauptstand: [`558febb1`](https://github.com/netzkontrast/sidekick/tree/558febb1cf0f4408671d17afbff759ad2e96005a). Maßgeblich sind [Vision v4](../vision.md), [Analyse](../analyse-und-uebernahmeplan.md), [Tore A–D](../entscheidungen/README.md), [Research-Plan](../../research/agent-hub/operations/PLAN.md) und die [Reflexion zur externen Spec](../../research/agent-hub/inputs/2026-10-30-reflexion-chatgpt-spec.md).

Zusätzlich berücksichtigt: [PR #5](https://github.com/netzkontrast/sidekick/pull/5) für Grilling/Fragenablage und [PR #6](https://github.com/netzkontrast/sidekick/pull/6) für Skills/Meta-Prompting sowie die Kernthese „Vertrag, Journal, Tor“. Beide sind zum Recherchezeitpunkt offene Vorschläge. Für PR #6 wurde Stand `e35f244b4dc3b99bf145ca42724466faf27f40e7` gelesen. Damit werden Gedächtnis-, Skill- und Modelländerungen gemeinsame Auftragsarten statt separater unkontrollierter Änderungswege.

## GitHub-Quellenmatrix

Jeder Link zeigt auf die gelesene README-Fassung. Aussagen sind **dokumentiert**; die letzte Spalte enthält unsere eigene Ableitung. Ein Commit ist keine getestete oder empfohlene Produktionsversion.

| Quelle | Gelesener Commit | Dokumentierter Ansatz | Ableitung für Sidekick |
|---|---|---|---|
| [cactus-compute/needle](https://github.com/cactus-compute/needle/blob/b4fc11b04f1852888d375c8c6dfbaca44572d014/README.md) | `b4fc11b04f1852888d375c8c6dfbaca44572d014` | Tool Calling, Extraktion, Embeddings und lokale LoRA-Anpassung | Frühen begrenzten Modellversuch durchführen; keine eigene Engine nachbauen. |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp/blob/aa588a3463357ee990b314f41dda242869130704/README.md) | `aa588a3463357ee990b314f41dda242869130704` | Lokaler Modellserver und CUDA-Unterstützung | Als austauschbaren lokalen Inferenzdienst evaluieren; kein öffentlich offener Port. |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp/blob/482279b8a18855ba741d7b88c30fcb3874691f59/README.md) | `482279b8a18855ba741d7b88c30fcb3874691f59` | Lokale Spracherkennung | Desktop-ASR-Kandidat; deutsche Aufnahmen und Latenz selbst messen. |
| [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx/blob/935e5ded3d949a8b557ac44ef4dad03a7d2038e7/README.md) | `935e5ded3d949a8b557ac44ef4dad03a7d2038e7` | ASR/TTS und Streaming auf mehreren Plattformen | Alternative für Sprache, falls Streaming/Sprachausgabe den Integrationsaufwand rechtfertigen. |
| [huggingface/transformers.js](https://github.com/huggingface/transformers.js/blob/656d627317100ac9f9bb7aa7952297b71f8c37b5/README.md) | `656d627317100ac9f9bb7aa7952297b71f8c37b5` | Inference in Browser/JS, WASM/WebGPU | Alternative für kleine Browseraufgaben; konkrete Modelle und Geräte getrennt prüfen. |
| [dexie/Dexie.js](https://github.com/dexie/Dexie.js/blob/45aade72aa19a601e6a13aa877beb7389e15b5d2/README.md) | `45aade72aa19a601e6a13aa877beb7389e15b5d2` | IndexedDB-Abstraktion | Kandidat für kleinen lokalen UI-Speicher; nicht mit automatischem verteiltem Sync gleichsetzen. |
| [electric-sql/pglite](https://github.com/electric-sql/pglite/blob/35e6aa0dd240eee480986e3a369adfcddf87b01b/README.md) | `35e6aa0dd240eee480986e3a369adfcddf87b01b` | Postgres als WASM im Browser, persistierbarer lokaler Zustand | Alternative bei begründetem SQL-Bedarf, nicht zusätzlich zu Dexie vorsorglich einbauen. |
| [automerge/automerge](https://github.com/automerge/automerge/blob/5bae7757ef7b92c8cd6850def388f22767305ccb/README.md) | `5bae7757ef7b92c8cd6850def388f22767305ccb` | Lokale Dokumente mit CRDT-Synchronisation | Für späteres kollaboratives Notieren prüfen; keine konkurrierenden Freigaben damit verschmelzen. |
| [vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa/blob/355cf3dd283ca50da3ac4759501e9c3312a3da91/README.md) | `355cf3dd283ca50da3ac4759501e9c3312a3da91` | Build-Integration für installierbare Offline-Webapps | PWA-Baukandidat; Offline-Zugriff und Updateablauf trotzdem praktisch testen. |
| [letta-ai/letta-code](https://github.com/letta-ai/letta-code/blob/ebc496e532f1a34da9ac8d7e2da41c5920ea77e6/README.md) | `ebc496e532f1a34da9ac8d7e2da41c5920ea77e6` | Persistenter Agentenkontext, Memory/Skills, Reflection/Dreaming | Beobachtbare Gedächtnisabläufe als Inspiration; keine automatische Selbständerung übernehmen. |
| [omacom/omarchy](https://github.com/omacom/omarchy/blob/717175d4a8c5a12f6c0fff10dcc3c1c08ef3a0d1/README.md) | `717175d4a8c5a12f6c0fff10dcc3c1c08ef3a0d1` | Linux-Arbeitsplatz und Diktierintegration | Betriebsumgebung des Nutzers; lokales Diktieren ausdrücklich auswählen. |

Lizenzgrenze: Keine dieser Implementierungen wird hier übernommen und keine Dependency installiert. Vor Auswahl Lizenzdatei, transitive Pakete, Modellgewichte, Stimmen, Engine-Binaries und Notices versionsgenau inventarisieren. Die [Needle3-Modellkarte](https://huggingface.co/Cactus-Compute/needle3) nennt Apache-2.0; daraus folgt keine pauschale Freigabe anderer Artefakte oder Cloud-Dienste. Clean-Room betrifft den eigenen Fachkern. Standardkomponenten können nach Entscheidung reguläre Dependencies werden.

## Vercel: Hub ja, unendlicher Prozess nein

**Dokumentiert:** [WebSockets sind seit 20.10.2026 allgemein verfügbar](https://vercel.com/changelog/websocket-support-is-now-generally-available). Die [offizielle Betriebsbeschreibung](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections) erklärt die Bindung einer Verbindung an eine Function-Instanz und deren Laufzeitgrenze; eine spätere Verbindung kann eine andere Instanz erreichen. Alte Aussagen „Vercel kann keine WebSockets“ sind damit überholt.

**Ableitung:** Der Connector öffnet ausgehend WSS/TLS. Geräteidentität und Pairing sind von der Transportverbindung getrennt. Aufträge, Freigaben und bestätigte Checkpoints liegen dauerhaft, etwa transaktional in Postgres. Ein gemeinsamer Zustellmechanismus erreicht Verbindungen auf unterschiedlichen Instanzen; eine Map im RAM reicht nicht. Presence hat eine TTL und ist kein Nachweis für einen lebenden Agentenprozess.

Jede Nachricht braucht Version, ID, Ablauf und passenden Kontext. Wiederverbindung verwendet Backoff, Cursor und Abgleich. Empfangsbestätigung, gültiger Claim, gestarteter Run und ausgeführter Effekt bleiben getrennte Tatsachen. Die konkreten Planlimits und laufenden Verbindungskosten werden vor Tor D erneut geprüft und gemessen.

**Offener Vergleich für Tor C:** bestehenden HTTPS-Polling/Event-Upload/SSE-Ansatz gegen erneuerbares WSS messen. Vercel-Präferenz ist gegeben; ein bestimmter Transport ist noch keine Entscheidung. Ein lang laufender lokaler Modellprozess wird nicht in eine Hub-Function verlegt.

## Offline und Gerätezugriff

**Dokumentiert:** [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) ermöglichen gecachte Webapps in sicheren Kontexten. Sie sind kein zuverlässig dauernder Hintergrundprozess. [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols) benötigt für verschiedene Netze zusätzliche Verbindungsmechanismen; direkte Erreichbarkeit ist nicht garantiert.

**Ableitung:** stabile HTTPS-PWA zuerst, optional lokales Serving über einen unterstützten sicheren Ursprung. Ein Doppelklick auf `file://index.html` ist kein vollständiger PWA-Betriebsmodus. Browser-Speicher ist an den Ursprung gebunden: Vercel- und localhost-Version teilen ihn nicht automatisch. Datenmigration, Export, Quota, mögliche Verdrängung und Backup gehören in die Spec.

Für einen lokalen Zugang vom HTTPS-Frontend zum PC sind Origin-Prüfung, Pairing, authentifizierte Anfragen und Browserregeln für lokalen Netzwerkzugriff praktisch zu prüfen. Bei Bedarf liefert der Connector eine lokale App aus; keine unsichere CORS-Freigabe als Abkürzung.

Eine Browser-App kann bei geschlossenem oder suspendiertem Browser weder den PC-Connector ersetzen noch jede Benachrichtigung garantieren. Die lokale GPU ist vom Handy nur nutzbar, wenn Rechner und ein erlaubter Kommunikationsweg erreichbar sind. Direct/P2P ist eine spätere Optimierung, nicht Voraussetzung der ersten Version.

## Sprache und Omarchy

**Dokumentiert:** Browser-[SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) ist nicht überall verfügbar und kann einen entfernten Erkennungsdienst verwenden. Offline-ASR darf daraus nicht stillschweigend abgeleitet werden.

Die [Omarchy-Diktierdokumentation](https://github.com/omacom/omarchy/blob/717175d4a8c5a12f6c0fff10dcc3c1c08ef3a0d1/manual/11-text-extraction-dictation.md) beschreibt Superwhisper als Standard sowie Voxtype als lokale Option. Sprache und Modell müssen passend eingerichtet werden.

**Ableitung:** Push-to-talk, sichtbare Aufnahme, editierbares Transkript, Textfallback. Desktop zuerst bestehendes lokales Diktieren oder whisper.cpp prüfen. Needle/Whistle oder sherpa-onnx nur bei belegtem Vorteil ergänzen. Kein permanentes Mithören. TTS, Wakeword und Telefonbetrieb kommen später.

## Needle3: Was lernt wie schnell?

### Eignung

**Dokumentiert:** [Needle3](https://cactuscompute.com/needle) spezialisiert sich auf Tool Calling, strukturierte Extraktion und Embeddings, mit kleinen ausführbaren Modellvarianten. Allgemeine Chatfähigkeit ist ausdrücklich eingeschränkt. Die [Modellkarte](https://huggingface.co/Cactus-Compute/needle3) und das offizielle README verweisen auf Browser-WASM und die Community-JS-Anbindung.

**Ableitung:** früh als lokales Absichtsmodell prüfen; kein Beleg für einen autobiografischen Gesprächspartner. Ein syntaktisch gültiger Tool Call kann sachlich falsch oder unerlaubt sein. Modellvorschläge gehen durch dieselbe Validierung wie andere Agentenvorschläge; keine direkte Ausführung von Modelloutputs.

### Lernaufwand: Herstellerbefund

Die [Fine-Tuning-Anleitung](https://www.cactuscompute.com/blog/finetuning-needle) dokumentiert lokal LoRA/JAX mit eingefrorenem Basismodell und CUDA-Unterstützung. Einige Hundert saubere Beispiele können die Werkzeugwahl verbessern; Argumentzuordnung benötigt eher Tausende. Für kleine Datensätze werden 10–30 Epochen genannt. Lokale Exporte sind 4-bit; der Confidence-Head wird nicht mittrainiert, der Score fehlt anschließend. Die gehostete Alternative verändert diese Bedingungen und lädt Daten hoch.

Das sind Herstellerbefunde, keine gemessene Lernkurve für Sidekick oder die RTX 3090 Ti. Eine belastbare Minutenangabe ist daraus nicht ableitbar.

### Im Code gefundene Rechengrundlage

Die gelesene [Trainingsschleife](https://github.com/cactus-compute/needle/blob/b4fc11b04f1852888d375c8c6dfbaca44572d014/needle/model/finetune.py) zieht zunächst den Validierungssplit ab und berechnet die Schritte als aufgerundete Trainingsmenge geteilt durch Batchgröße.

Eigene Beispielrechnung: 1.000 nutzbare Beispiele, 10 % Validierung und Batch 16 ergeben 57 Trainingsschritte je Epoche; zehn Epochen ergeben 570 Schritte. Hinzu kommen Vorbereitung, JIT, Validierung und Export. Die Datei wurde gelesen, nicht ausgeführt.

**Messplan auf dem Ziel-PC:** Software-/Treiberstände fixieren; CUDA tatsächlich nachweisen; 20 Aufwärm- und 50 Messschritte bei festgehaltener Sequenzlänge erfassen; Sekunden/Schritt, Spitzen-VRAM, Gesamtzeit und Exportgröße protokollieren. JIT-Neukompilation und Validierung separat ausweisen. Aufwärm-/Messzahlen sind Versuchsvorschläge, keine Herstellerempfehlung.

### Was wir trainieren

Ein enger Katalog: Erinnerung vorschlagen, Vorhaben erfassen, Status abfragen, Klärung anfordern. Trainingsdaten bestehen aus Eingabe, erlaubtem Tool-Katalog und geprüfter Zielentscheidung; keine rohen Session-Dumps. Keine geheimen oder wechselnden persönlichen Fakten in Gewichte schreiben.

Zuerst feste unabhängige Testfälle abtrennen. Danach Lernkurve etwa für 200/500/1.000 Beispiele, bei Bedarf mehr; Splits nach Ursprungssession und Aufgabe, nicht erst nach erzeugten Paraphrasen. Deutsche Formulierungen, falsche/fehlende Argumente und Fälle ohne passenden Aufruf einbeziehen. Regeln und Basismodell bleiben Baselines.

Messen: exakte Werkzeug-/Argumentrichtigkeit, notwendige Rückfragen, falsche Aktionsvorschläge, Latenz und Größe des exportierten Modells. Ein separater Policy-Test muss jeden unerlaubten Vorschlag blockieren. Keine Ableitung von Rechten aus dem nicht verfügbaren Fine-Tune-Confidence-Wert.

Abbruch: kein Vorteil gegenüber einfacher Baseline, unzureichende deutsche Qualität, ungeklärte Artefaktlizenz oder untragbarer Betriebsaufwand. In diesem Fall bleibt Gedächtnis per Retrieval nutzbar, ohne Fine-Tune.

## Träumen und Selfplay: was sich sinnvoll übertragen lässt

**Dokumentiert:** Letta Code beschreibt persistente Kontextdateien und Reflection/Dreaming. Das zeigt einen Produktansatz für Konsolidierung; es beweist kein automatisches Training persönlicher Modellgewichte.

**Im Code gefunden:** Selfplays [Memory-Modul](https://github.com/netzkontrast/Selfplay/blob/1bd816f44243e435bb40d8520259b6e5e392665b/src/sim/memory.ts) speichert beobachtete Ausschnitte, erzeugt periodisch Verkettungen als Reflexionsvorschlag und rankt Erinnerungen heuristisch. Es ist keine gelernte Langzeitgedächtnisarchitektur.

**Dokumentiert:** Selfplays [Mirror-Protokoll](https://github.com/netzkontrast/Selfplay/blob/1bd816f44243e435bb40d8520259b6e5e392665b/docs/MIRROR_PROTOCOL.md) trennt vorgeschlagene Absicht, deterministische Prüfung und beobachterspezifische Projektion. Der Text markiert die Engine-/Rendererintegration selbst als geplant.

**Eigene Übertragung:** Sidekick-Agenten reichen typisierte Vorschläge ein; Kern und Policy bestätigen; UI, Sprache und Agenten-API erhalten erlaubte Projektionen. Erinnerungen benötigen Quellen, Gültigkeit, Widerruf und Konfliktbehandlung. Fiktionales Selfplay-Wissen und persönliches Wissen bleiben getrennt.

## Speicher, Vergessen und Grenzen

Ein append-only Journal darf kein unzerstörbares Archiv persönlicher Rohdaten werden. Vorschlag: technische Ereignisumschläge mit minimiertem Inhalt, sensible Inhalte in gesonderten löschbaren Objekten. Löschung widerruft Suchindex, Caches, Kontextpakete und Trainingsverwendung; Backups und getrennte Geräte brauchen dokumentierte Fristen.

Bereits trainierte Gewichte lassen sich durch Löschen eines Datenbankeintrags nicht zuverlässig bereinigen. Deshalb persönliche Fakten zuerst extern speichern und Training auf freigegebene Verhaltensbeispiele begrenzen. Bei notwendigem Rückzug: betroffene Modelle deaktivieren, verteilte Versionen widerrufen und aus bereinigtem Datensatz neu trainieren. Offline-Geräte können einen Widerruf erst nach Kontakt oder Ablauf einer Berechtigung umsetzen.

Diese Regeln sind vorgeschlagen, nicht praktisch nachgewiesen. Sie sind Voraussetzung für die Gedächtnisspec.

## Offene Versuche und Entscheidungstore

| Versuch | Erkenntnis | Tor |
|---|---|---|
| Fake-Auftrag über zwei Clients mit Unterbrechung | Zustellung, Claims, Effekte und sichtbare Unsicherheit | A/C |
| Aktuelle Claude-Anbindung mit Capability-Test | Permission, Cancel, Resume tatsächlich unterstützt? | B |
| Erneuerbarer Vercel-Kanal plus dauerhafte Zustellung | Instanzwechsel, Authentifizierung, Kosten | C/D |
| Offline-PWA und lokaler Browserzugriff | Browser-/Origin-Grenzen, Speicher, echte Offline-Funktionen | C/D |
| Deutsches Diktat auf Ziel-PC | Latenz, Fehler und Datenweg | B/D |
| Baseline gegen Needle-Fine-Tune | Lerngewinn und tatsächliche Trainingszeit | B |
| Erinnerungskandidat korrigieren und zurückziehen | Provenienz, Konflikte, Löschpfad | A/D |

Startreihenfolge, Abnahmekriterien und Rücknahme stehen im [Bauauftrag](../claude-startauftrag-vision-v5.md). Die bestehenden P0-Untersuchungen zu Paperclip/OpenHands und Claude werden dadurch nicht als erledigt markiert.
