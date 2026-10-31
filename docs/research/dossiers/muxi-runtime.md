# Dossier: MUXI Runtime

> Nach [Vorlage](_vorlage.md). Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Beschrieben ist beobachtbares Verhalten mit Fundstellen. Es wurde kein Code übernommen. Die Lizenz (Elastic License 2.0) schließt eine Übernahme ohnehin praktisch aus.
> Untersucht mit CodeGraph (`codegraph_explore`, `codegraph node`) statt Datei-für-Datei-Lektüre.

| Feld | Wert |
|---|---|
| URL | [muxi-ai/runtime](https://github.com/muxi-ai/runtime) |
| Commit-SHA | [`8a14cf510d33f53d42389bfddd2eec95a3dd5049`](https://github.com/muxi-ai/runtime/tree/8a14cf510d33f53d42389bfddd2eec95a3dd5049) (flacher Klon) |
| Release / Datum | Commit vom 09.10.2026; Python, 428 Quelldateien unter `src/` |
| Lizenz(en), Notices, Assets | **Elastic License 2.0** ([`LICENSE`](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/LICENSE)): Quelltext einsehbar, aber kein Open-Source-Recht. Unter anderem kein Angebot als gehosteter Dienst und kein Umgehen von Lizenzschlüsseln. |
| Priorität / Tor | Vergleich zur [afs-spec](afs-spec.md) (Spec gegen Umsetzung); Bezug zu Tor B und Tor C. Kein Kandidat für Tor A. |
| Geprüft am / von | 31.10.2026 · Claude Code mit CodeGraph 1.6.2; nur Lesen, keine Tests ausgeführt |

## Kurzfassung

MUXI ist die Referenz-Runtime der Agent-Formation-Spec. Untersucht wurden die Teile, die für sidekick zählen:
Coding-Delegation (`services/coding/`), Job-Beobachtung (`services/watch/`) und Gruppenrechte (`services/gbac/`).
Ergebnis: Die Spec-Zusagen zu Aufruf, Abbruch, Timeout und `done_when` sind im Code umgesetzt. Zwei Abweichungen sind für sidekick wichtig:

1. Die Parallelitätsgrenze gilt **pro Nutzer**, nicht pro Formation wie in afs-spec §7.6.
2. Der Rückweg eines Ergebnisses in die Unterhaltung läuft **fest ohne Freigabe** (`bypass_workflow_approval=True`), und die Antwort kann über Benachrichtigungskanäle nach außen gehen.

Ein Neustart macht laufende Jobs ehrlich zu `orphaned`, statt sie still neu zu starten. Das deckt sich mit sidekicks `lost`.

## Startanleitung

Nicht ausgeführt. Das Repo enthält Dockerfiles, `pyproject.toml`/`uv.lock` und eine E2E-Suite unter `e2e/tests/` (u. a. `24_coding`, `26_watch`). Lauffähigkeit ist *offen*.

## Öffentliche Verträge (Code gegen Spec)

Alle Zeilen *im Code gefunden* am obigen Commit; „Spec“ verweist auf das [afs-spec-Dossier](afs-spec.md).

| Thema | Fundstelle | Beobachtung | Spec |
|---|---|---|---|
| Adapter-Prüfung | [`coding/config.py` L178–197](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/config.py#L178-L197) | Unbekannte Schlüssel und jede Secret-Referenz in einer Adapterdefinition brechen das Laden ab; Begründung im Fehlertext: Argumente sind per `ps` sichtbar | deckt sich |
| Session-Formen | [`coding/config.py` L133–145](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/config.py#L133-L145), [`service.py` L362–365](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L362-L365) | Drei Formen über Eigenschaften `generates_session_id`, `captures_session_id`, `supports_resume`; die Runtime erzeugt eine UUID für den ersten Lauf | deckt sich |
| Fortsetzen | [`service.py` L317–344](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L317-L344) | Ohne gespeicherte Session-ID oder ohne Resume-Baustein: freundlicher Fehler statt Simulation | deckt sich |
| Parallelität | [`service.py` L300–315](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L300-L315) | Gezählt werden laufende Jobs **desselben Nutzers**; Überschreitung ist ein Fehler, keine Warteschlange | **weicht ab**: Spec §7.6 sagt „per formation“ |
| Arbeitsverzeichnis | [`service.py` L387–396](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L387-L396), [L646–657](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L646-L657) | Neues Verzeichnis `<root>/<user>/<job>`, Ausbruchsprüfung, kein Überschreiben; Löschen nur innerhalb deklarierter Wurzeln | deckt sich |
| Aufruf | [`service.py` L410–443](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L410-L443) | Start als Argumentliste ohne Shell, eigene Prozessgruppe (`start_new_session=True`), `PWD` auf das Arbeitsverzeichnis gesetzt; Secrets nur über die Umgebung | deckt sich |
| Timeout | [`service.py` L453–495](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L453-L495), [L134–142](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L134-L142) | `SIGKILL` an die ganze Gruppe, bis 10 s Warten; gepufferte Teilausgabe wird weiter ausgewertet, damit die Session-ID erhalten bleibt; Status `timed_out` | deckt sich |
| Abbruch | [`service.py` L796–810](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L796-L810) | Merker setzen, Gruppe beenden; `cancelled` wird erst nach Prozessende gesetzt (über den Ausführungspfad), vor dem Start sofort | deckt sich |
| Kosten | [`service.py` L477–483](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L477-L483), [`models.py` L56](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/models.py#L56) | Kosten aus der Ausgabe gelesen und gespeichert, sonst leer | über Spec hinaus |
| Neustart | [`service.py` L219–259](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L219-L259), [`models.py` L1–13](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/models.py#L1-L13) | Prozesse überleben keinen Neustart; beim Hochfahren werden laufende Zeilen `orphaned` mit Ereignis | über Spec hinaus |
| Rückweg | [`service.py` L694–743](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L694-L743) | Ergebnis kommt als interne Anfrage mit `route_class: delegation` und **`bypass_workflow_approval=True`** zurück; die Antwort geht an den Benachrichtigungsrouter (Kanäle, Webhook) | Spec sagt „durch die volle Middleware“, verschweigt den Freigabe-Bypass |
| `watch_job` Eingabe | [`watch/service.py` L418–444](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L418-L444) | Geschlossene Schlüssel, genau eines von `equals` und `in` | deckt sich |
| `watch_job` Vergleich | [`watch/service.py` L78–91](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L78-L91), [L586–592](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L586-L592) | Wahrheitswerte nur gegen Wahrheitswerte; fehlender Pfad heißt „nicht fertig“; Zeichenketten-Fallback für Zahlen | deckt sich |
| `watch_job` Ablauf | [`watch/service.py` L450–507](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L450-L507) | Erster Abruf nach einem Intervall, fester Takt, kein Backoff; Fristprüfung nach dem Abruf; Fehler in Folge → `failed`; Fristende → `timed_out` mit letzter Antwort | deckt sich |
| `watch_job` Rechte | [`watch/service.py` L120–123](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L120-L123), [L341–370](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/watch/service.py#L341-L370) | Rechte des Aufrufers beim Anlegen festgehalten und je Abruf wiederhergestellt, nie gespeichert; nach Neustart `orphaned` „statt zu raten“. Werkzeug muss für den Aufrufer sichtbar sein; Quote pro Nutzer, höchste Gruppenvorgabe gewinnt | deckt sich |
| Gruppen | [`gbac/resolver.py` L200–313](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/gbac/resolver.py#L200-L313) | Gruppen nur aus der Middleware; ohne Gruppen und ohne Fallback wird abgelehnt; unbekannte Gruppen geben nichts frei und werden einmal gemeldet; Cache nur für YAML-Auflösung, nie für Middleware-Antworten | deckt sich; fail-closed bei Middleware-Fehler nicht geprüft (*offen*) |

## Persistenz

Jobs liegen im Speicher und, wenn die Formation persistentes Gedächtnis hat, in den Tabellen `coding_delegations` und `watch_jobs`.
Gespeichert werden auch Prompt, Ergebnis und Herstellersession-ID ([`models.py` L38–62](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/models.py#L38-L62)). Prompts landen damit im Klartext in der Datenbank (*im Code gefunden*).

## Credential-Fluss

Die Runtime hält die Credentials der Formation und gibt sie der Coding-CLI über die Prozessumgebung mit ([`service.py` L419–428](https://github.com/muxi-ai/runtime/blob/8a14cf510d33f53d42389bfddd2eec95a3dd5049/src/muxi/runtime/services/coding/service.py#L419-L428)); die Umgebung der Runtime wird dabei vollständig vererbt. Für sidekick heißt das: Ein Kindprozess sieht alle Umgebungsvariablen des Hosts. Der Connector muss die Umgebung stattdessen auf eine Positivliste begrenzen.

## Sicherheitsgrenzen

- Keine Sandbox: Isolation ist eine eigene Prozessgruppe plus Arbeitsverzeichnis (*im Code gefunden*, siehe Aufruf).
- Rechte-Flags der CLI kommen ungeprüft aus `coding.extra_args` in den Aufruf (*im Code gefunden*: `build_command(... extra_args=self.config.extra_args)`, `service.py` L410–417).
- Ergebnisse kehren ohne Freigabe in die Unterhaltung zurück und können über Kanäle nach außen gehen (siehe Rückweg).

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Netzwerkunterbrechung | nicht untersucht | *offen* |
| Prozess-/Runtime-Neustart | laufende Delegationen und Beobachtungen → `orphaned`, mit Ereignis; kein automatischer Neustart | *im Code gefunden* |
| Doppelte Zustellung | Job-ID wird bei jedem Aufruf neu erzeugt; keine Idempotenz für wiederholte Aufrufe | *im Code gefunden* (`service.py` L351–352) |
| Rechteentzug | Beobachtungen nutzen die beim Anlegen festgehaltenen Rechte bis zum Ende; laufende Delegationen werden nicht neu geprüft | *im Code gefunden* bzw. *offen* |
| Rückweg scheitert | Fehler wird beobachtet und protokolliert, der Job bleibt abgeschlossen | *im Code gefunden* (`service.py` L730–743) |

## Tests

Keine eigenen Läufe. Vorhanden sind Unit-Tests (`tests/unit/coding/`, `tests/unit/watch/`, `test_gbac_*`) und E2E-Gruppen `24_coding` und `26_watch`. Der strikte Wahrheitswertvergleich hat einen eigenen Test (`test_bool_matching_is_strictly_typed`).

## Bewertung für den Hub

**Kategorie:** Verhalten neu implementieren (nur Erkenntnisse) · alles Übrige zurückstellen. Keine Dependency und keine Integration: Die Elastic License 2.0 verbietet unter anderem, MUXI als Dienst anzubieten, und passt nicht zu sidekick als offenem Self-hosting-Projekt.

Was der Code für die [Runtime-Adapter-Spec](../../spec/runtime-adapter-v0.md) (PR #32) bestätigt oder ergänzt:

1. **Bestätigt:** Argumentliste ohne Shell, eigene Prozessgruppe, Timeout mit Erhalt der Session-ID, strikter Wahrheitswertvergleich, fehlender Pfad = nicht fertig (RTA-AUF-01, RTA-LEB-03, RTA-BEO-04/-05).
2. **Bestätigt:** Ein Neustart erzeugt einen ehrlich unklaren Zustand statt eines blinden Neustarts (`orphaned` ≈ RTA-LEB-06 `lost`).
3. **Ergänzen:** Die Umgebung eines Runs braucht eine Positivliste; MUXI vererbt die ganze Host-Umgebung.
4. **Ergänzen:** Rechte einer Beobachtung beim Anlegen festhalten und nie aus dem Speicher wiederherstellen (bei Neustart unklar statt geraten).
5. **Negativfall:** Der Rückweg eines Ergebnisses darf keine Freigabe umgehen und keine Kanal-Benachrichtigung auslösen, die selbst eine Außenwirkung ist.
6. **Klarstellen:** Die Parallelitätsgrenze braucht einen benannten Bezug (Gerät, Owner oder Auftrag); MUXI zählt pro Nutzer, die Spec pro Formation.

## Offene Punkte

1. Fail-closed bei Middleware-Fehlern im Code nicht nachgeprüft (nur die Auflösung ohne Gruppen).
2. Inhalt von `build_command` und `parse_output` (`coding/adapter.py`) nicht im Detail gelesen; die Spec-Regeln „letzter nichtleerer Treffer“ und „erste Session-ID“ sind dort zu prüfen.
3. Die Unit- und E2E-Tests wurden nicht ausgeführt.
4. Ob die Delegationstabelle Prompts verschlüsselt ablegt, hängt an der Datenbankkonfiguration (*offen*).
