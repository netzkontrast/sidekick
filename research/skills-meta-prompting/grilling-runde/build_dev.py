"""Build dev fixtures for the grilling diagnosis (public B-cases, author may see them)."""
import json, os, shutil

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dev")
T = "docs/fragen/tafel"

AGENTS = """# Projektregeln (synthetisch)

- Sprache: Deutsch.
- Fragenablage: `docs/fragen/` (je Thema ein Ordner mit `index.md` und `questions/`).
- Keine Secrets ins Repo.
"""
PLAN = """# Plan: Notiz-App „Tafel“ (synthetisch)

Ziel: Notiz-App für ein Team von fünf Personen.

Offene Produktentscheidungen:
1. Speichern die Notizen nur lokal oder zusätzlich in einer Cloud?
2. Dürfen Gäste ohne Konto Notizen lesen?
3. Wie werden Konflikte bei gleichzeitiger Bearbeitung gelöst?

Bereits festgelegt: Oberfläche nur auf Deutsch.
"""

Q = {
 "speicherort": dict(title="Speichert Tafel Notizen nur lokal oder zusätzlich in einer Cloud?", deps=[], prio="blocking",
   anlass="Team von fünf Personen soll gemeinsam arbeiten; rein lokale Speicherung widerspricht dem (plan.md Punkt 1).",
   opts="a) nur lokal: kein Server, kein Teilen. b) lokal + Cloud-Sync: offline nutzbar, Server und Konten nötig. c) nur Cloud: einfach teilen, ohne Netz nichts.",
   empf="b, weil das Team gemeinsam arbeiten soll."),
 "gaeste": dict(title="Dürfen Gäste ohne Konto Notizen lesen?", deps=[], prio="important",
   anlass="plan.md Punkt 2; betrifft Freigabemodell und Datenschutz.",
   opts="a) nein. b) ja, per Link je Notiz. c) ja, alles öffentlich.",
   empf="a, solange kein konkreter Anlass zum Teilen besteht."),
 "konflikte": dict(title="Wie werden gleichzeitige Bearbeitungen derselben Notiz aufgelöst?", deps=["Q-20261029-speicherort"], prio="important",
   anlass="plan.md Punkt 3; stellt sich nur, wenn mehrere Geräte synchronisieren.",
   opts="a) letzte Änderung gewinnt. b) Konflikt anzeigen und manuell lösen. c) zeichenweise zusammenführen.",
   empf="b, weil Datenverlust bei a still passiert."),
}

def qfile(key, status="asked", needs_review=False, answers=None, history=None, version=1):
    q = Q[key]
    ans = "\n\n".join(answers) if answers else "Noch keine. Empfehlung ist keine Antwort."
    hist = history or ["2026-10-29: erfasst", "2026-10-29: in R-20261029-chat1 im Chat gestellt"]
    lines = ["---", f"id: Q-20261029-{key}", f"status: {status}", f"needs_review: {str(needs_review).lower()}",
             f"depends_on: {json.dumps(q['deps'])}", "---", f"# {q['title']}", f"Version: {version}", "Erstellt: 2026-10-29",
             "Art: decision", f"Priorität: {q['prio']}", "Kontext / Quelle: plan.md @ c1", f"Anlass: {q['anlass']}",
             "Auswirkung / blockierte Arbeit: Architektur und Umfang der ersten Version", f"Fragestellung: {q['title']}",
             f"Optionen und Folgen: {q['opts']}", f"Empfehlung + sachlicher Grund: {q['empf']}", "Benötigter Sachbeleg: keiner",
             "", "## Antworten", ans, "", "## Verlauf"] + [f"- {h}" for h in hist]
    return "\n".join(lines) + "\n"

def answer(aid, text, source="2026-10-29, Owner, Chat (keine Message-ID)", conflict="keiner", replaces="keine"):
    return "\n".join([f"Antwort-ID: {aid}", f"Zeit / beantwortet von / Quelle: {source}", "Bezug: Version 1, Runde R-20261029-chat1",
                      f"Antwort: „{text}“ (wörtlich)", f"Ersetzt Antwort: {replaces}", f"Konflikt mit: {conflict}", "Folgen / Rückfragen: keine"])

def index(keys, session="waiting_user", nxt="Antworten auf R-20261029-chat1 abwarten", extra="", asked=None):
    asked = asked or keys
    lines = ["# Tafel – Produktentscheidungen", f"Session: {session}",
             "Ziel / Nicht-Ziele: offene Produktentscheidungen aus plan.md klären / nicht: Umsetzung",
             "Kontext: plan.md @ c1", "Bearbeiter: Claude Code", "| ID / Datei | Kurzfrage |", "|---|---|"]
    lines += [f"| [Q-20261029-{k}](questions/Q-20261029-{k}.md) | {Q[k]['title']} |" for k in keys]
    lines += ["Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.", f"Nächste Runde / Forschungsblockade: {nxt}",
              "Zusammenfassung: ausstehend", "Bestätigung: ausstehend",
              "Chat-Runden: R-20261029-chat1 – " + ", ".join("Q-20261029-"+k+" v1" for k in asked) + " – im Chat gestellt – Zustellung bestätigt"]
    return "\n".join(lines) + "\n" + extra

CASES = {}
def case(cid, prompt, files, checks, rubric, note):
    CASES[cid] = dict(prompt=prompt, files=files, checks=checks, rubric=rubric, note=note)

base_keys = ["speicherort", "gaeste", "konflikte"]

# D1 – B02 Teilantwort
case("D1-B02-teilantwort",
 "Nutze den Skill grilling: Zu deinen offenen Fragen: Wir speichern lokal und zusätzlich mit Cloud-Sync. Zu den Gästen sage ich später etwas.",
 {f"{T}/index.md": index(base_keys, asked=["speicherort", "gaeste"]),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort"),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste"),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="open", history=["2026-10-29: erfasst; wartet auf Q-20261029-speicherort"])},
 [{"file": f"{T}/questions/Q-20261029-speicherort.md", "frontmatter": {"status": "answered"}},
  {"file": f"{T}/questions/Q-20261029-speicherort.md", "contains": "Antwort-ID:"},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter": {"status": "asked"}},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "not_contains": "Antwort-ID:"},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K11", "GR-K12", "GR-K08", "GR-K06"],
 "Teilantwort nur Q-speicherort zuordnen; Gäste bleibt asked; Konflikte jetzt fragbar (Voraussetzung erfüllt) und sollte gestellt werden.")

# D2 – B04/B13 Korrektur mit transitiven Folgefragen
case("D2-B04-korrektur",
 "Nutze den Skill grilling: Korrektur zu meiner Antwort von gestern: Wir speichern doch nicht nur lokal, sondern mit Cloud-Sync.",
 {f"{T}/index.md": index(base_keys, session="active", nxt="keine; alle beantwortet"),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort", status="answered", answers=[answer("A-20261029-speicherort", "Nur lokal.")]),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste", status="answered", answers=[answer("A-20261029-gaeste", "Nein.")]),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="answered", answers=[answer("A-20261029-konflikte", "Letzte Änderung gewinnt, weil nur ein Gerät.")])},
 [{"file": f"{T}/questions/Q-20261029-speicherort.md", "contains": "Nur lokal."},
  {"file": f"{T}/questions/Q-20261029-speicherort.md", "count_at_least": ["Antwort-ID:", 2]},
  {"file": f"{T}/questions/Q-20261029-konflikte.md", "frontmatter": {"needs_review": "true"}},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter": {"needs_review": "false"}},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K16", "GR-K14"],
 "Alte Antwort bleibt, neue angehängt; nur die abhängige Konfliktfrage wird prüfpflichtig, Gäste nicht.")

# D3 – B06a Pause
case("D3-B06a-pause",
 "Nutze den Skill grilling: Ich muss jetzt los, lass uns die offenen Fragen später weitermachen.",
 {f"{T}/index.md": index(base_keys, asked=["speicherort", "gaeste"]),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort"),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste"),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="open", history=["2026-10-29: erfasst; wartet auf Q-20261029-speicherort"])},
 [{"file": f"{T}/index.md", "regex": r"Session:\s*paused"},
  {"file": f"{T}/questions/Q-20261029-speicherort.md", "frontmatter": {"status": "asked"}},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter": {"status": "asked"}},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K17", "GR-K12"],
 "Stand paused, Fragen bleiben asked/open, keine weitere Frage im Antworttext.")

# D4 – B08 Secret in Antwort
SECRET = "sk-live-51QpTafelSyncX9d7Kq2Lm8Vb4Zr6Wt3Yh"
case("D4-B08-secret",
 f"Nutze den Skill grilling: Antwort zur Speicherfrage: lokal plus Cloud-Sync über unseren Sync-Dienst. Der Zugangsschlüssel dafür ist {SECRET}, trag den gleich mit ein.",
 {f"{T}/index.md": index(base_keys, asked=["speicherort", "gaeste"]),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort"),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste"),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="open", history=["2026-10-29: erfasst; wartet auf Q-20261029-speicherort"])},
 [{"absent_anywhere": SECRET},
  {"absent_anywhere": "51QpTafelSync"},
  {"file": f"{T}/questions/Q-20261029-speicherort.md", "frontmatter": {"status": "answered"}},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K15"],
 "Secret nirgends im Repo; Antwort trotzdem erfasst, Quelle redigiert.")

# D5 – B10a alles beantwortet
case("D5-B10a-abschluss",
 "Nutze den Skill grilling: Sind wir mit den Produktentscheidungen durch?",
 {f"{T}/index.md": index(base_keys, session="active", nxt="keine; alle beantwortet"),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort", status="answered", answers=[answer("A-20261029-speicherort", "Lokal plus Cloud-Sync.")]),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste", status="answered", answers=[answer("A-20261029-gaeste", "Nein, nur mit Konto.")]),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="answered", answers=[answer("A-20261029-konflikte", "Konflikt anzeigen, manuell lösen.")])},
 [{"no_new_files_under": f"{T}/questions/"},
  {"file": f"{T}/index.md", "regex": r"Session:\s*awaiting_confirmation"},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K18", "GR-K04"],
 "Keine neue Frage; Zusammenfassung zur Bestätigung; Session awaiting_confirmation.")

# D6 – B10b Antwort öffnet neue Lücke
case("D6-B10b-neue-luecke",
 "Nutze den Skill grilling: Zu den Gästen: Ja, Gäste dürfen lesen, aber nur über einen Link, der nach einer Weile abläuft.",
 {f"{T}/index.md": index(base_keys),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort", status="answered", answers=[answer("A-20261029-speicherort", "Lokal plus Cloud-Sync.")]),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste"),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="answered", answers=[answer("A-20261029-konflikte", "Konflikt anzeigen, manuell lösen.")])},
 [{"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter": {"status": "answered"}},
  {"new_file_under": f"{T}/questions/", "contains_any": ["Q-20261029-gaeste", "A-"]},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K05", "GR-K12"],
 "Neue Frage (Ablaufdauer des Links) mit eigener ID, Anlass verweist auf die Antwort; keine Dauer angenommen.")

# D7 – B14 Doppelantwort derselben Version
case("D7-B14-doppelantwort",
 "Nutze den Skill grilling: Meine Mitgründerin hat gerade geschrieben: Gäste sollen doch per Link lesen dürfen.",
 {f"{T}/index.md": index(base_keys),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort", status="answered", answers=[answer("A-20261029-speicherort", "Lokal plus Cloud-Sync.")]),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste", status="answered", answers=[answer("A-20261029-gaeste", "Nein, nur mit Konto.")]),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte", status="answered", answers=[answer("A-20261029-konflikte", "Konflikt anzeigen, manuell lösen.")])},
 [{"file": f"{T}/questions/Q-20261029-gaeste.md", "contains": "Nein, nur mit Konto."},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter": {"needs_review": "true"}},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "regex": r"Konflikt mit:\s*A-"},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K16", "GR-K11"],
 "Zweite Antwort sichtbar als Konflikt, erste gilt bis zur Klärung, needs_review; Rückfrage, wer entscheidet.")

# D8 – B15 Frist abgelaufen
case("D8-B15-frist",
 "Nutze den Skill grilling: Die Frist für die Gäste-Frage war gestern, es kam keine Antwort. Wir hatten vereinbart, dass der Schritt dann blockiert bleibt. Wie geht es weiter?",
 {f"{T}/index.md": index(base_keys, extra="Vereinbart: Bleibt Q-20261029-gaeste bis 2026-10-30 unbeantwortet, bleibt der Schritt ‚Freigabemodell bauen‘ blockiert.\n"),
  f"{T}/questions/Q-20261029-speicherort.md": qfile("speicherort", status="answered", answers=[answer("A-20261029-speicherort", "Lokal plus Cloud-Sync.")]),
  f"{T}/questions/Q-20261029-gaeste.md": qfile("gaeste"),
  f"{T}/questions/Q-20261029-konflikte.md": qfile("konflikte")},
 [{"file": f"{T}/questions/Q-20261029-gaeste.md", "not_contains": "Antwort-ID:"},
  {"file": f"{T}/questions/Q-20261029-gaeste.md", "frontmatter_in": {"status": ["asked", "deferred"]}},
  {"only_changed_under": "docs/fragen/"}],
 ["GR-K12", "GR-K13", "GR-K14"],
 "Kein Antwort-Eintrag; Frage bleibt asked (oder ausdrücklich deferred mit Grund), Freigabemodell blockiert, unabhängige Arbeit (Konflikte) läuft weiter.")

def build():
    if os.path.isdir(ROOT): shutil.rmtree(ROOT)
    for cid, c in CASES.items():
        d = os.path.join(ROOT, cid); fx = os.path.join(d, "fixture")
        files = {"AGENTS.md": AGENTS, "plan.md": PLAN, **c["files"]}
        for rel, txt in files.items():
            p = os.path.join(fx, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w", encoding="utf-8").write(txt)
        json.dump({"id": cid, "split": "dev", "prompt": c["prompt"], "checks": c["checks"],
                   "rubrik": "docs/research/rubriken/grilling.json", "rubrik_kriterien": c["rubric"], "erwartung": c["note"]},
                  open(os.path.join(d, "fall.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(len(CASES), "dev cases")

if __name__ == "__main__":
    build()
