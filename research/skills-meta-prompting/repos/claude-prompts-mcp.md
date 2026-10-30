# Dossier: claude-prompts-mcp

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/claude-prompts-mcp |
| Upstream (laut Doku) | https://github.com/minipuft/claude-prompts (laut `server/package.json`) |
| Commit-SHA | `7e1fb3f02a226b232464a5ae98132d25344813dd` |
| Letzter Commit | 2025-07-10 (minipuft, Doku zu v1.1.0 „Intelligent Execution“) |
| Lizenz | MIT, „Copyright (c) 2024 minipuft“ |
| Art | Server (MCP, TypeScript, STDIO/SSE) · Prompt-Bibliothek |
| Geprüft am / von | 2026-10-30 / Claude Code (CodeGraph- und Dokumentenlektüre, lokaler Regex-Test) |

## Zweck

MCP-Server, der eine Markdown-Prompt-Bibliothek nach Kategorien lädt, als MCP-Prompts und über ein
Tool `execute_prompt` bereitstellt, Templates mit Nunjucks rendert und Prompts per Tool anlegen,
ändern, löschen und neu laden lässt *(dokumentiert, im Kern im Code gefunden)*.

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Kategorie-Registry | Zentrale Konfiguration listet Kategorien und importiert je Kategorie eine `prompts.json` mit Metadaten (ID, Name, Datei, Argumente, Tools-Flag, Verhalten bei leerem Aufruf). | *im Code gefunden* | [loader.ts#L30](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/loader.ts#L30), [types.ts#L149](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/types.ts#L149) |
| Prompt als Markdown mit Abschnitten | Abschnitte für Beschreibung, Systemnachricht, Nutzer-Template und optional Kettenschritte werden per Regex aus der Datei geschnitten. | *im Code gefunden* | [loader.ts#L286](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/loader.ts#L286) |
| Registrierung unter ID und/oder Name | Konfigurierbarer Modus; jedes Argument wird als optionaler String registriert, das `required`-Flag wird ignoriert. | *im Code gefunden* | [registry.ts#L88](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/registry.ts#L88), [registry.ts#L296](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/registry.ts#L296) |
| Nunjucks-Templating | Rendering mit Bedingungen/Schleifen, Autoescape aus, undefinierte Variablen werden leer; Loader ist auf den Prompt-Ordner gesetzt. | *im Code gefunden* | [jsonUtils.ts#L17](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/utils/jsonUtils.ts#L17) |
| Textreferenzen | Argumente über 500 Zeichen werden als Referenz zwischengespeichert und nach dem Rendern wieder eingesetzt. | *im Code gefunden* | [template-processor.ts#L36](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/template-processor.ts#L36) |
| Semantische Klassifikation | Regex-Muster ordnen Prompts „template/workflow/chain“ mit Konfidenz zu; explizite Ketten erhalten Konfidenz 1. | *im Code gefunden* | [semanticAnalyzer.ts#L26](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/utils/semanticAnalyzer.ts#L26) |
| Quality Gates | Gate-Typen: Länge, Schlüsselwörter, Format (Markdown/JSON/YAML), Abschnitte, „custom“. Gates werden automatisch aus der Klassifikation abgeleitet. | *im Code gefunden* | [gateValidation.ts#L87](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/utils/gateValidation.ts#L87), [index.ts#L785](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/index.ts#L785) |
| Ketten (Chains) | Kettenschritte mit Prompt-ID, Name, Ein-/Ausgabe-Mapping. `execute_prompt` liefert für Ketten nur Anweisungstext, welche Schritte der Client nacheinander aufrufen soll. | *im Code gefunden* | [index.ts#L613](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/index.ts#L613) |
| Prompt-Verwaltung per Tool | Tools `update_prompt`, `delete_prompt`, `modify_prompt_section`, `reload_prompts`, `listprompts`; Schreiben über eine Datei-Hilfsfunktion mit Transaktionslogik. | *im Code gefunden* | [prompt-management-tools.ts#L161](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/prompt-management-tools.ts#L161) |
| Hot-Reload | Neu laden von Platte, Daten an alle Module verteilen, Prompts neu registrieren; optional Neustart per Exit-Code 100 für einen Prozessmanager. | *im Code gefunden* | [orchestration/index.ts#L732](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/index.ts#L732) |
| Transporte | STDIO und SSE (Express-API inkl. REST-Endpunkt für Reload). | *im Code gefunden* | [api/index.ts#L206](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/api/index.ts#L206) |

## Artefakte und Formate

- `server/config.json` (Servername, Registrierungsmodus, Transporte, Logging), `server/promptsConfig.json` (Kategorien + Importe).
- Je Kategorie `prompts.json` + Markdown-Dateien; 69 Markdown-Prompts, davon sieben mit Kettenabschnitt.
- MCP-Prompts (SDK `@modelcontextprotocol/sdk` 1.6.1 laut Lockfile) plus Tools; Capability `prompts.listChanged` wird angekündigt [orchestration/index.ts#L387](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/index.ts#L387).
- Repo-Hygiene: zahlreiche `*:Zone.Identifier`- und `.bak`-Dateien eingecheckt; `npm test` verweist auf ein nicht vorhandenes `test-server.js` *(im Code gefunden)*.

## Messung und Evaluation

- Keine Tests im Repo; Build/Start nicht ausgeführt (würde `npm install` erfordern) *(offen)*.
- **Praktisch nachgewiesen** (2026-10-30, Node v22.22.0): Die beiden Ketten-Regexe aus [loader.ts#L321](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/loader.ts#L321)
  und [loader.ts#L336](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/loader.ts#L336) wurden in einem eigenen Skript (Scratchpad, nicht eingecheckt) auf die sieben
  mitgelieferten Ketten-Dateien angewandt: zwei Dateien (`development/code_review_chain.md`, `general/content_chain_example.md`)
  ergeben **0 Schritte**, weil sie ein anderes Format (Überschrift je Schritt, JSON-Mappings) nutzen als der Parser erwartet.
  Dokumentiertes und geparstes Ketten-Format weichen also voneinander ab.
- Gates prüfen den **gerenderten Prompt-Text**, nicht eine Modellantwort ([index.ts#L548](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/index.ts#L548)) *(im Code gefunden)*.
  Der Server ruft kein Modell auf; die „Ausführung“ einzelner Schritte ist ein Echo des Templates ([prompt-executor.ts#L126](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/prompt-executor.ts#L126)),
  und der serverseitige Ketten-Executor ([prompt-executor.ts#L149](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/prompt-executor.ts#L149)) hat keinen Aufrufer *(im Code gefunden, CodeGraph)*.
- Ein automatisch vergebenes Gate fordert das Format „structured“ ([index.ts#L840](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/index.ts#L840)), das der Evaluator nicht kennt
  und daher immer als nicht bestanden wertet; „custom“-Gates bestehen immer ([gateValidation.ts#L105](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/utils/gateValidation.ts#L105)) *(im Code gefunden)*.
  Manuell definierte Gates werden von keinem Lader befüllt.
- README-Aussagen wie „versteht Prompts wie ein Mensch“ oder „intelligente Retry-Mechanismen“ sind durch den Code nicht gedeckt (Regex-Heuristik, Retry nur als Hinweistext).

## Grenzen und Risiken

- Hot-Reload ist **manuell** (Tool/REST); im Code findet sich kein Dateiwächter, obwohl `CLAUDE.md`/README „File watching“ nennen *(im Code gefunden)*.
- Re-Registrierung: Alte Prompts werden nur entfernt, wenn der Server eine passende Methode hat ([registry.ts#L124](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/registry.ts#L124)); ob das SDK 1.6.1 Doppelregistrierungen ablehnt und Reload damit wirkungslos bleibt, ist *offen*.
- `update_prompt` übernimmt `id` und `category` ungeprüft in Dateipfade ([prompt-management-tools.ts#L163](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/prompt-management-tools.ts#L163), [L442](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/mcp-tools/prompt-management-tools.ts#L442)) – potenzielle Pfad-Traversal per Tool-Aufruf *(im Code gefunden, nicht ausgenutzt)*.
- Nunjucks mit Dateisystem-Loader und ohne Escaping: Nutzer- bzw. Modell-geschriebene Templates können andere Dateien im Prompt-Ordner einbinden; Sandbox-Grenzen *offen*.

## Clean-Room-Relevanz

- **Anforderung R1:** Prompt-/Skill-Registry mit Kategorien, stabiler ID, Metadaten und typisierten Argumenten; `required` und Typen müssen tatsächlich durchgesetzt werden.
- **Anforderung R2:** Templating mit Bedingungen/Schleifen in einer Sandbox (kein freier Dateizugriff, definierte Includes), strikter Modus für undefinierte Variablen wählbar.
- **Anforderung R3:** Ketten als deklaratives, schema-validiertes Format (Schritte, Ein-/Ausgabe-Mapping); Parser und Doku aus einer Quelle; Validierung beim Laden mit Fehlermeldung statt stiller 0-Schritte-Kette.
- **Anforderung R4:** Gates prüfen Modell**ausgaben** pro Schritt, mit bekannten, getesteten Prüftypen und echtem Retry-Zähler; unbekannte Typen sind Ladefehler.
- **Anforderung R5:** Hot-Reload über Dateiwächter **und** explizites Kommando, atomarer Austausch der Registry, Client-Benachrichtigung über `listChanged`; Schreib-Tools mit Pfad-Whitelist.
- Nicht übernommen: Regex-„Semantik“-Klassifikation, Beispiel-Prompts, Server-Code.
- Kategorie: **Verhalten neu implementieren** (MIT erlaubt Übernahme, Codequalität spricht dagegen).

## Offene Punkte

- Server nach `npm ci` in isolierter Umgebung bauen und `reload_prompts` gegen SDK 1.6.1 testen (Doppelregistrierung).
- Pfad-Traversal von `update_prompt` in Wegwerf-Kopie praktisch prüfen.
- Neuere Upstream-Versionen von minipuft/claude-prompts sichten (Fork-Stand Juli 2025), bevor Schlüsse auf den aktuellen Stand gezogen werden.
