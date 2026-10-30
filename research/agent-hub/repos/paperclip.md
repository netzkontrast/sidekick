# paperclip

Stand 2026-10-30. Referenzcommit: 0c70cedce9a803bdc201324528abb35e423e7cd0.
Quelle gelesen: https://github.com/paperclipai/paperclip/blob/master/docs/adapters/overview.md (beweglicher Branch; exakte Commit-Fassung als nächster Prüfschritt). Repository-Snapshot: https://github.com/paperclipai/paperclip/commit/0c70cedce9a803bdc201324528abb35e423e7cd0

Evidenz: Dokumentation gelesen, keine praktische Validierung.

## Erste Befunde

Adapter besitzen execute, Output-Parsing und strukturierte Ergebnisse. Externe Adapter können als Pakete installiert werden. ACP liefert reichere Live-Events als generische process/http-Adapter.

Credential-Topologie ist kritisch: Dokumentation beschreibt unter anderem Upload eines hostseitigen Codex-Authfiles in verwaltete Sandboxes. Dieses Muster widerspricht unserem Ziel, Abo-Credentials am lokalen Gerät zu belassen, und wird nicht ungeprüft übernommen.

## Nächste Prüfung

Claim-Transaktion und Epoch suchen; Tool-Permission-Pfad statt nur organisatorischer Approvals prüfen; Rechte bei Restart/Widerruf verfolgen. Öffentliche Adapter-Verträge als Integration priorisieren, keine Credential-Kopierlogik portieren.
