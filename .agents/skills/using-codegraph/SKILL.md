---
name: using-codegraph
description: Beantworte Fragen zu vorhandenem Code und bereite Codeänderungen mit dem CodeGraph-Index vor, bevor du grep oder Read nutzt. Ein Aufruf liefert Quelltext mit Zeilennummern, Aufrufpfade und Wirkungsradius. Nutze bei „wie funktioniert X“, „wer ruft Y auf“, „wo ist X definiert“, „was bricht, wenn ich Z ändere“, vor jeder Codeänderung, beim Untersuchen fremder Repos und nach Änderungen zur Testauswahl; „how does X work“, „who calls Y“, „what breaks if I change Z“. Nicht für Markdown, Doku oder Konfiguration ohne Code, exakte Fehlermeldungen und Logtexte oder Umbenennungen, die auch Kommentare und Strings betreffen.
---

# Code mit CodeGraph verstehen

1. Prüfe, ob ein Index den Pfad abdeckt: `codegraph status [-p PFAD]` nennt die Projektwurzel und `Files` > 0. Ein Index kann über dem Repo liegen und mehrere Klone abdecken. Fehlt er, frage den Menschen; führe `codegraph init` oder `codegraph index` nicht selbst aus. Meldet `status` Referenzen aus einem abgebrochenen Lauf, führe `codegraph sync` aus.
2. Stelle jede Codefrage zuerst an `codegraph_explore` (MCP) bzw. `codegraph explore "<Namen oder Frage>"` (Shell). Nenne Symbol- und Dateinamen oder stelle eine kurze Frage; für ein anderes Projekt `projectPath` bzw. `-p`. Die Antwort enthält Quelltext, Aufrufpfade und Wirkungsradius und gilt als gelesen: nicht per Read oder grep nachprüfen.
3. Frage gezielt nach, statt Dateien zu öffnen: Namen aus Lückenmarkern und „Not shown above“ in ein weiteres `explore` übernehmen. Ein Symbol mit Aufrufern: `codegraph node NAME`; eine Datei mit Zeilen: `codegraph node -f DATEI --offset N --limit M`.
4. Vor einer Änderung den Wirkungsradius prüfen: `codegraph impact SYMBOL [-f DATEI]`, bei Bedarf `callers`/`callees`. Danach die betroffenen Tests bestimmen: `git diff --name-only HEAD | codegraph affected --stdin --quiet`, und diese ausführen.
5. Beachte den Veraltungshinweis (⚠️): Nur die dort genannten Dateien sind noch nicht neu indexiert; lies genau diese per Read. Der Watcher synchronisiert nach rund zwei Sekunden.
6. Nutze grep/Read nur für nicht indexierte Inhalte (Markdown, Doku), exakte Zeichenketten, Umbenennungen samt Kommentaren und Strings, Dateien über 1 MB, als veraltet markierte Dateien oder wenn `explore` nichts findet. Dynamische Aufrufe (Reflexion, Dependency Injection, Namenskonventionen) kann der Graph übersehen; lies dann gezielt nach und sage das.
7. Gib Code-Erkundung nicht an Subagents ab, die CodeGraph nicht kennen. Delegierst du doch, schreibe diesen Skill oder den Befehl `codegraph explore` in den Auftrag.
8. Belege Codeaussagen mit `pfad:zeile` aus der Ausgabe, in Dossiers mit Permalink auf den untersuchten Commit. Befehle, versteckte MCP-Werkzeuge, Konfiguration und Grenzen: [Befehle und Grenzen](references/befehle.md).
