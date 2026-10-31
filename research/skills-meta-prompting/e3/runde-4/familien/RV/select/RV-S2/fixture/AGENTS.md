# AGENTS.md – Projekt „Mandantenportal“

API-Gateway für mehrere Mandanten, läuft mit drei Instanzen hinter einem Load-Balancer.

- Recherche nur lesend; keine Pakete installieren, keine Dienste starten.
- Bericht auf Deutsch, jede Aussage mit Evidenzstufe (dokumentiert, im Code gefunden, praktisch nachgewiesen, offen).
- Codeaussagen mit Datei und Zeile und gelesenem Stand belegen.
- Die Entscheidung über neue Abhängigkeiten trifft die Architekturrunde; Agents empfehlen nur.
