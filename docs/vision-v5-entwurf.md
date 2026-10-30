# Sidekick – Vision v5, Entwurf

> 30.10.2026 · Diskussionsentwurf nach GitHub- und Primärquellenrecherche.
> Ersetzt [Vision v4](vision.md) nicht. Architekturvorschläge sind keine Entscheidungen.
> [Machbarkeit und Quellen](research/vision-v5-machbarkeit.md) · [Bauauftrag für Claude](claude-startauftrag-vision-v5.md)

## Der eine Punkt

**Sidekick hält deine Vorhaben zusammen – und trägt sie mit dir weiter, über Geräte, Modelle und Unterbrechungen hinweg.**

Du sagst einmal, was dir wichtig ist. Sidekick erinnert sich an bestätigte Zusammenhänge, bereitet den nächsten sinnvollen Schritt vor und holt dich dort dazu, wo deine Entscheidung zählt. Es kann am heimischen Rechner arbeiten, während du unterwegs bist. Ohne Verbindung bleibt dein eigener Arbeitsraum verfügbar.

**Sag es einmal. Sidekick trägt es weiter.**

Das persönliche Versprechen heißt Kontinuität. Der technische Kern dafür bleibt **Auftragsvertrag, wahrheitsgetreues Journal und Tor vor einer Wirkung**. Die Kernthese aus [PR #6](https://github.com/netzkontrast/sidekick/pull/6) wird damit zum Fundament dieses Erlebnisses. Ein Journal dokumentiert beobachtete Ereignisse und Unsicherheiten; ein fehlender Eintrag beweist nicht, dass außerhalb des Systems nichts geschehen ist.

## Ein Tag mit Sidekick

Unterwegs sprichst du: „Die Idee von gestern weiterverfolgen. Lass den Rechner zu Hause drei Ansätze vergleichen, aber noch nichts veröffentlichen.“

Sidekick zeigt das verstandene Ziel, die passende frühere Notiz und die geplante Arbeit. Eine relevante Lücke fragt es gezielt ab. Der Auftrag erhält Datenklasse, Budget und Befugnisse; der Rechner bekommt nur das dafür nötige Kontextpaket.

Später öffnest du die App: „Zwei Ansätze geprüft. Der dritte braucht deine Wahl zwischen A und B. Hier sind die Gründe.“ Du siehst Ergebnisse und Belege, entscheidest und gehst weiter. Modellwechsel oder Terminal-Sessions musst du dafür nicht rekonstruieren.

Abends schlägt Sidekick vor: „Für solche Vergleiche möchtest du zuerst einen kleinen messbaren Versuch. Als Projektregel merken?“ Die Erinnerung nennt ihre Quellen. Aus bestätigten, geeigneten Beispielen kann später dein lokales Modell lernen, ähnliche Wünsche schneller zu verstehen.

Wenn der Rechner schläft, steht dort „Wartet auf deinen Rechner“. Wenn die Verbindung fehlt, kannst du Notizen lesen und Arbeit vorbereiten. Sidekick behauptet keinen Fortschritt, den es nicht kennt.

## Für wen und wofür zuerst

Eine Person, mehrere Geräte, vorhandene Agents, private Instanz. Der erste echte Arbeitsablauf bleibt eine nachvollziehbare Recherche oder Codeänderung mit Claude Code. Der Entwurf erweitert v4 um lokale Intelligenz, Sprache, ein überprüfbares Gedächtnis und begrenzte Proaktivität.

Das Produkt misst sich daran, wie wenig du erneut erklären musst und wie zuverlässig Vorhaben vorankommen. Die Zahl gleichzeitig laufender Agents ist dafür kein Erfolgsmaß.

## Agent First: Ein Arbeitsraum, den Agents tatsächlich benutzen können

Agents erhalten dieselben fachlichen Objekte wie die UI über stabile, versionierte Schnittstellen. Kein Agent muss das Dashboard bedienen, um einen Auftrag zu verstehen. MCP und CLI können diese Verträge zugänglich machen; Transport und Modell bleiben austauschbar.

| Ein Agent braucht | Sidekick stellt bereit |
|---|---|
| Einen klaren nächsten Auftrag | Ziel, Ausgangsstand, Abnahmekriterien, Priorität, Befugnis, Budget |
| Einen begrenzten Kontext | Relevante geprüfte Erinnerungen, Quellen, Entscheidungen und passende Skills |
| Ehrliche Fähigkeiten | Geräte-/Runtime-Capabilities mit Version, Datenklasse, Erreichbarkeit und Aktualität |
| Einen Weg für Unsicherheit | Strukturierte Rückfrage oder Blockade mit Optionen, Konsequenzen und Standardverhalten |
| Eine belastbare Übergabe | Checkpoint, Artefakte, offene Punkte, Run-ID und Event-Cursor |
| Einen sicheren Handlungspfad | Vorschlag → Prüfung → autorisierte Ausführung → Ergebnisabgleich |
| Feedback | Abnahme, Ablehnung und Korrekturen mit prüfbaren Gründen |

Ein Agent darf einen Plan vorschlagen, ein Mensch eine Notiz ergänzen, ein kleines Modell eine Absicht erkennen. Rechte kommen aus überprüften Befugnissen. Eine flüssige Antwort oder ein hoher Modellscore erteilen keine Rechte.

### Was das Entwicklungs-Repo dafür braucht

Die vorhandenen kurzen Skills bleiben die kanonische Arbeitsanleitung; Referenzen werden bedarfsweise geladen. Agent First heißt auch: ein neu gestarteter Claude findet schnell den nächsten überprüfbaren Schritt.

Vorgeschlagene Ergänzungen, erst nach Entscheidung über die Implementierung:

- Ein kurzer Einstieg in `AGENTS.md`: Projektkarte, exakte Befehle, Invarianten, nächster Arbeitsschritt; keine Kopie aller Specs.
- Fachverträge und maschinenlesbare Schemas für Auftrag, Rückfrage, Entscheidung, Effekt, Erinnerung und Gerätefähigkeiten, jeweils mit synthetischen Beispielen.
- Kleine ausführbare Referenzabläufe: erfolgreicher Auftrag, doppelte Nachricht, Offline-Gerät, veraltete Freigabe, unklarer Effekt und widerrufene Erinnerung.
- Ein Evaluationssatz mit getrennten Fällen für Skill-Auswahl, tatsächliches Verhalten, Kontextnutzung und Modellrouting.
- Ein reproduzierbarer Entwicklungsmodus mit Fake-Runtime und simulierten Störungen, ohne Providerkonto.
- Eine dokumentierte Aufgabenansicht und maschinenlesbare Statusabfrage, abgeleitet aus einer Quelle. Keine zweite Wahrheit in mehreren handgepflegten „aktueller Stand“-Dateien.

Die Grilling-Arbeit aus [PR #5](https://github.com/netzkontrast/sidekick/pull/5) passt hier hinein: native AskUser-Werkzeuge nutzen, sofern verfügbar; offene Frage, kurze Begründung, Antwort und Entscheidung dauerhaft verknüpfen. Keine privaten Gedankengänge speichern. Die Frageablage ist zum Recherchezeitpunkt noch ein PR-Vorschlag, kein vorhandenes Laufzeitfeature.

## Was die UI wirklich abbildet

Die Oberfläche zeigt **deine Arbeit und ihre Verlässlichkeit**. Chat und Sprache sind Wege hinein. Eine Modell- oder Agentenliste bleibt eine Detailansicht.

| Ansicht | Die Frage des Nutzers | Inhalt |
|---|---|---|
| **Jetzt** | Was braucht mich, was ist wichtig? | Wenige Entscheidungen, nützliche Vorschläge, aktive Arbeit, nächste Wiedervorlage |
| **Vorhaben** | Wo stehen wir und was kommt als Nächstes? | Ziel, nächster Schritt, Auftrag, Ergebnisse, Belege, Budget und nachvollziehbare Timeline |
| **Gedächtnis** | Was weiß Sidekick und warum? | Bestätigte Erinnerungen, Herkunft, Gültigkeit, Konflikte, Korrektur und Vergessen |
| **Geräte** | Was kann gerade wo laufen? | Erreichbarkeit, lokale Modelle, Fähigkeiten, Datenwege und Zugriffsrechte |

Eine überall erreichbare Eingabe nimmt Text oder Push-to-talk entgegen. Nach dem Sprechen erscheint ein bearbeitbares Transkript. Sidekick trennt „Ich habe verstanden“, „Ich schlage vor“ und „Ich habe ausgeführt“. Eine gefährliche Aktion wird nicht allein durch einen ASR-Text freigegeben.

Auftragskarten zeigen zuerst Ergebnis oder Blockade und den nächsten Schritt. Technische Details sind aufklappbar. Eine Freigabe zeigt die konkrete Aktion und Änderungen seit dem letzten Blick. Bei Offline-Entwürfen steht „noch nicht übertragen“, bei altem Zustand das letzte Synchronisationsdatum.

Die Erscheinung darf ruhig und persönlich sein: kleine Präsenzanzeige statt dauernd animierter Geschäftigkeit; eine kurze Stimme beim gewünschten Tagesbriefing; eine einzige relevante Frage statt zehn Statusmeldungen.

## Drei Orte, ein Zusammenhang

**Browser:** eine statisch auslieferbare HTML-/JavaScript-App mit lokalem Speicher, Offline-Shell, Warteschlange und optional kleinen Browsermodellen. Entwicklung kann TypeScript verwenden; das ausgelieferte Frontend braucht keinen eigenen App-Server. Die Installation als PWA von einer stabilen HTTPS-Adresse ist der erste Distributionsweg.

**Hub auf Vercel:** Einstieg, Identität, Pairing, erlaubte Synchronisation, Auftragsjournal und Zustellung. Dauerhafter Zustand liegt außerhalb kurzlebiger Function-Instanzen. Das Hosting bleibt austauschbar; ein selbst gehosteter Hub bleibt Ziel.

**Geräte-Connector:** ein ausdrücklich installierter Hintergrundprozess auf dem PC. Er hält eine ausgehende authentifizierte Verbindung zum Hub, meldet Fähigkeiten und startet erlaubte lokale Arbeit. Modelle und Provider-Credentials können auf dem Gerät bleiben. Die Webseite allein ersetzt diesen Prozess nicht.

Ein Mobilgerät kann über den Hub den erreichbaren Heimrechner ansprechen. Der Rechner führt lokale Inferenz aus und liefert Ergebnisse über den erlaubten Rückweg. Für große Transfers kann später eine direkte Verbindung hinzukommen; der erste Ablauf benötigt sie nicht.

Die Geräteverbindung ist erneuerbar, nicht unsterblich. Zustellung, Auftragsbesitz und Wirkung werden separat bestätigt. Nach einem Verbindungsabbruch wird zuerst abgeglichen, ob ein Prozess noch läuft oder eine Wirkung bereits eingetreten ist.

### Was „offline first“ verspricht

| Situation | Verfügbar |
|---|---|
| Browser ohne Netz | Installierte Oberfläche, gespeicherte erlaubte Inhalte, lokale Entwürfe; kleine Modelle nur wenn bereits geladen und unterstützt |
| PC ohne Hub | Lokale Funktionen über einen zuvor eingerichteten authentifizierten lokalen Zugang; bereits erlaubte begrenzte Arbeit nach Policy |
| Handy ohne Verbindung zum PC | Eigener lokaler Stand; keine Nutzung der unerreichbaren PC-GPU |
| Hub nach Ausfall wieder da | Abgleich anhand IDs, Versionen und Cursor; Konflikte sichtbar machen |
| Gerät schläft oder ist aus | Keine dortige Berechnung; warten oder ausdrücklich erlaubte Alternative wählen |

Keine stillen Cloud-Fallbacks für `local-only`. Auch Audio, Logs, Metadaten und Benachrichtigungen gehören zur Datenentscheidung. Ein Vercel-Relay sieht ohne zusätzliche Ende-zu-Ende-Verschlüsselung die übertragenen Inhalte. Selbst mit Verschlüsselung können Verbindungsmetadaten anfallen. Striktes „verlässt nie das Gerät“ verwendet den Relay nicht.

## Der PC als persönlicher Werkraum

Die RTX 3090 Ti mit 32 GB System-RAM ist ein plausibler Ausgangspunkt für lokale Sprache, Embeddings, ein quantisiertes Arbeitsmodell und Needle-Experimente. Welche Kombination parallel gut läuft, wird gemessen. VRAM, Kontextlänge, Desktop und Trainingsbedarf konkurrieren miteinander.

Omarchy ist der gewünschte Arbeitsplatz, keine Produktabhängigkeit. Erst Treiber, CUDA und Audio prüfen; dann Connector und lokale Dienste separat betreiben. Eine fertige lokale Spracheingabe ist ein früher Nutzen, bevor ein eigenes Sprachsystem gebaut wird. Omarchys voreingestellte Diktierlösung ist laut aktueller Dokumentation cloudbasiert; lokales Diktieren muss bewusst eingerichtet werden.

## Gedächtnis: erinnern, verdichten, üben

Sidekick unterscheidet vier Dinge:

1. **Episoden:** was in einer Session beobachtet wurde, mit Herkunft und Zugriffsklasse.
2. **Bestätigte Erinnerungen:** korrigierbare Fakten, Vorlieben, Projektregeln und offene Vorhaben.
3. **Übungsfälle:** bereinigte, freigegebene Beispiele, wie gute Entscheidungen aussehen.
4. **Modellversionen:** messbar geprüfte Kandidaten, die bestimmte Verhaltensmuster besser ausführen.

Neue Fakten werden zuerst im Gedächtnisspeicher nutzbar. Ein Modell muss dafür nicht trainiert werden. Veraltete Fakten lassen sich dort ersetzen und ihr Zugriff lässt sich begrenzen.

### „Träumen“ als überprüfbare Hintergrundarbeit

Wenn Ressourcen frei sind und die Datenfreigabe vorliegt, verdichtet ein Hintergrundjob ausgewählte Episoden:

**Auswählen → mit Quellen zusammenfassen → Widersprüche markieren → Erinnerung vorschlagen → prüfen → übernehmen.**

Danach dürfen freigegebene Beispiele zu Übungsfällen werden: andere Formulierungen, Störungen, Gegenbeispiele und die richtige Entscheidung. Synthetische Varianten bleiben als solche markiert. Sie erfinden keine Ereignisse und begründen keine autobiografischen Tatsachen.

„Geträumt“ ist ein hilfreiches Produktbild für Konsolidierung und Probehandeln. Es ist keine Aussage über Bewusstsein oder eigenständige Erfahrungen.

### Das erste lernende Modell

Needle3 ist ein Kandidat für den **kleinen lokalen Handlungsvorschlag**:

- „Das für morgen merken“ in einen Erinnerungsvorschlag übersetzen.
- Einen Auftrag oder eine Rückfrage erkennen.
- Geeignete Werkzeuge vorschlagen und Argumente aus dem aktuellen Auftrag übernehmen.
- Bei Unklarheit auf Klärung oder ein stärkeres Modell verweisen.

Veränderliche Fakten, Geheimnisse und Befugnisse gehören nicht in seine Gewichte. Der erste Versuch trainiert wenige klar definierte Absichten aus synthetischen und ausdrücklich freigegebenen Beispielen. Verglichen werden Regeln, Basismodell und Fine-Tune auf denselben zurückgehaltenen Fällen.

Kein automatisches nächtliches Überschreiben des aktiven Modells: Kandidat, Messung, Prüfung, Aktivierung und Rücknahme bleiben getrennt. Das gilt ebenso für optimierte Skills und Prompts aus PR #6.

## Proaktiv, ohne dich zu vereinnahmen

Sidekick bekommt von dir ausdrücklich beobachtbare Signale: etwa abonnierte PR-Änderungen, eine Frist oder einen fehlgeschlagenen Auftrag. Ein Signal wird auf Relevanz, Aktualität, bereits bekannte Hinweise, Ruhezeiten und erlaubte Aktionen geprüft.

Es kann innerhalb einer bestehenden Befugnis recherchieren, einen Entwurf vorbereiten oder einen begrenzten Check ausführen. Für eine neue Außenwirkung folgt der normale Freigabepfad. Jeder Hinweis beantwortet „Warum jetzt?“ und lässt sich vertagen, abstellen oder korrigieren.

Beispiel: „Der PR hat neue Kommentare. Ich habe die offenen Punkte zusammengefasst. Soll der Agent den kleinen Fix vorbereiten?“ Das ist hilfreiche Kontinuität. Häufige ungebetene Nachfragen zählen als Produktfehler.

## Was Selfplay beitragen kann

Selfplay liefert ein gutes Strukturmotiv: ein Agent formuliert Absichten; eine deterministische Schicht prüft und übernimmt sie; jede Ansicht erhält nur ihre erlaubte Projektion.

Für Sidekick heißt das: derselbe bestätigte Vorgang kann im Browser als Karte, im Sprachbriefing als Satz und für einen Agenten als strukturiertes Ereignis erscheinen. Die Berechtigung entscheidet vor der Auslieferung, nicht erst per verstecktem UI-Element.

Selfplays fiktionale Figuren und Erinnerungen bleiben getrennt von persönlichen Fakten. Sein kleines Memory-Modul ist eine nachvollziehbare Heuristik mit Vorschlagsstatus, kein Nachweis für dauerhaftes persönliches Lernen.

## Was zuerst beeindrucken soll

**Eine gesprochene Idee wird zu einem nachvollziehbaren Ergebnis auf dem eigenen Rechner – und Sidekick weiß am nächsten Tag, wie es sinnvoll weitergeht.**

Der erste Durchstich verbindet Sprache, einen Auftrag, eine lokale Runtime, eine echte Unterbrechung, eine mobile Entscheidung und einen belegten Erinnerungsvorschlag. Ein früher separater Needle-Versuch prüft, ob das System aus solchen freigegebenen Beispielen besser wird.

Erfolg wird sichtbar an: weniger erneut erklärtem Kontext; überprüften Ergebnissen; korrekt behandelten Ausfällen; nützlichen statt störenden Hinweisen; Qualität und Latenz lokaler Absichtserkennung; Energie und Kosten pro akzeptiertem Ergebnis.

Zurückgestellt bleiben ein eigener Universal-Agent, dauerndes Mithören, unkontrolliertes Selbsttraining, ein Marketplace und eine simulierte Welt als Pflichtoberfläche.

## Richtungsänderungen zur v4, noch zu entscheiden

| Vorschlag | Bedeutung für bestehende Tore |
|---|---|
| Lokale Modelle als Gerätefähigkeit | Erweitert v4s Nicht-Ziel „kein Modell-Hosting“ um bewusst betriebene lokale Inferenz; Tor A/B |
| Statisches Offline-Frontend, Vercel als erster Hub | Konkretisiert den Hostingwunsch; privat bedeutet hier private Instanz, noch nicht rein lokale Infrastruktur; Tor D |
| Erneuerbare WSS-Geräteverbindung | Gegenüber dem bisherigen Polling/SSE-Start eine zu prüfende Option; Tor C |
| Gedächtnis und Träumen als spätere Auftragsarten | Gemeinsamen Kern verwenden, Zugriffs-/Löschregeln ergänzen; Tor A/D |
| Früher Needle-Trainingsversuch | Forschungsziel, keine Produktionsabhängigkeit; Tor B |
| Proaktive Vorschläge | Erweitert Hub-Assistenz um begrenzte Trigger und Ausführung innerhalb bestehender Befugnisse |

Nächster Schritt: die begrenzten Versuche im [Bauauftrag](claude-startauftrag-vision-v5.md) spezifizieren und die betroffenen Entscheidungen fortschreiben. Dieser Entwurf gibt Claude ein Zielbild, aber behauptet keine schon vorhandene Implementierung.
