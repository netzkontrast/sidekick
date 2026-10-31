"""Check that every grader quote ("beleg") appears verbatim in the graded output.

Usage: python3 verify_quotes.py <bewertung.json> <dir-with-outputs> [--fixtures <familien-dir>]
Outputs are <dir>/<code>.md; a quote also counts as verified if it occurs in the case fixture
(graders may cite the fixture). Whitespace is normalised; surrounding quote marks are stripped.
"""
import json, os, re, sys

QUOTES = '„“”"«»‚‘’\''


def norm(s):
    s = re.sub(r"[*`|_>#]", " ", s)          # Markdown-Auszeichnung zählt nicht als Inhalt
    s = s.replace("„", '"').replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def pieces(beleg):
    """A beleg may hold several quoted parts and commentary; check the quoted parts if any.
    Ellipses ("…", "(...)", "[...]") split a quote into fragments that must each occur."""
    parts = re.findall(r"[„\"«‚]([^“\"»‘]{6,})[“\"»‘]", beleg)
    parts = [p for p in parts if len(norm(p)) >= 6] or [beleg.strip(QUOTES + " ")]
    frags = []
    for p in parts:
        for f in re.split(r"\s*(?:…|\(\.\.\.\)|\[\.\.\.\]|\.\.\.)\s*", p):
            f = f.strip(QUOTES + " ")
            if len(norm(f)) >= 12:
                frags.append(f)
    return frags


def fixture_text(fdir):
    out = []
    if fdir and os.path.isdir(fdir):
        for root, _, files in os.walk(fdir):
            for f in files:
                out.append(open(os.path.join(root, f), encoding="utf-8", errors="ignore").read())
    return norm("\n".join(out))


def main():
    bew, odir = sys.argv[1], sys.argv[2]
    fam = sys.argv[sys.argv.index("--fixtures") + 1] if "--fixtures" in sys.argv else None
    data = json.load(open(bew, encoding="utf-8"))
    stats = {"zitate": 0, "verifiziert": 0, "nur_fixture": 0, "nicht_gefunden": 0, "ohne_beleg": 0}
    misses = []
    items = data.get("ausgaben") or data.get("faelle") or {}
    for code, a in items.items():
        p = os.path.join(odir, f"{code}.md")
        if not os.path.exists(p):
            continue
        out = norm(open(p, encoding="utf-8").read())
        fx = fixture_text(os.path.join(fam, a["fall"], "fixture")) if fam and a.get("fall") else ""
        for k in a.get("kriterien", a.get("punkte", [])):
            b = (k.get("beleg") or k.get("zitat") or "").strip()
            if not b or b.lower().startswith("fehlt"):
                stats["ohne_beleg"] += 1
                continue
            for q in pieces(b):
                stats["zitate"] += 1
                nq = norm(q)
                if nq in out:
                    stats["verifiziert"] += 1
                elif fx and nq in fx:
                    stats["nur_fixture"] += 1
                else:
                    stats["nicht_gefunden"] += 1
                    misses.append({"ausgabe": code, "kriterium": k.get("kriterium", k.get("punkt", ""))[:60], "zitat": q[:120]})
    print(json.dumps({"datei": bew, **stats, "beispiele_nicht_gefunden": misses[:8]}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
