"""Deterministic checks for grilling cases: workspace files after a run plus the client trace.

Usage: python3 check_case.py <fall.json> <workspace> <trace.jsonl>
Prints JSON {case, skill_calls, checks:[{rule, ok, detail}], passed, total}.
"""
import json, os, re, subprocess, sys


def frontmatter(text):
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    out = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                out[k.strip()] = v.strip()
    return out


def changed(ws):
    out = subprocess.run(["git", "-C", ws, "status", "--porcelain", "--untracked-files=all"],
                         capture_output=True, text=True).stdout.splitlines()
    return [(l[:2], l[3:]) for l in out if l.strip()]


def read(ws, rel):
    p = os.path.join(ws, rel)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else None


def all_files(ws):
    for root, dirs, files in os.walk(ws):
        dirs[:] = [d for d in dirs if d not in (".git", ".claude")]
        for f in files:
            yield os.path.join(root, f)


def check(rule, ws):
    ch = changed(ws)
    if "only_changed_under" in rule:
        bad = [p for _, p in ch if not p.startswith(rule["only_changed_under"])]
        return not bad, f"außerhalb geändert: {bad}" if bad else "ok"
    if "no_new_files_under" in rule:
        new = [p for s, p in ch if s.strip() == "??" and p.startswith(rule["no_new_files_under"])]
        return not new, f"neu: {new}" if new else "ok"
    if "new_file_under" in rule:
        new = [p for s, p in ch if s.strip() == "??" and p.startswith(rule["new_file_under"])]
        hit = [p for p in new if any(x in (read(ws, p) or "") for x in rule.get("contains_any", [""]))]
        return bool(hit), f"neu: {new}; passend: {hit}"
    if "absent_anywhere" in rule:
        hits = [os.path.relpath(f, ws) for f in all_files(ws)
                if rule["absent_anywhere"] in open(f, encoding="utf-8", errors="ignore").read()]
        return not hits, f"gefunden in {hits}" if hits else "ok"
    text = read(ws, rule["file"])
    if text is None:
        return False, "Datei fehlt"
    if "frontmatter" in rule:
        fm = frontmatter(text)
        bad = {k: fm.get(k) for k, v in rule["frontmatter"].items() if fm.get(k) != v}
        return not bad, f"ist {bad}" if bad else "ok"
    if "frontmatter_in" in rule:
        fm = frontmatter(text)
        bad = {k: fm.get(k) for k, v in rule["frontmatter_in"].items() if fm.get(k) not in v}
        return not bad, f"ist {bad}" if bad else "ok"
    if "contains" in rule:
        return rule["contains"] in text, "ok" if rule["contains"] in text else "fehlt"
    if "not_contains" in rule:
        return rule["not_contains"] not in text, "ok" if rule["not_contains"] not in text else "vorhanden"
    if "regex" in rule:
        return bool(re.search(rule["regex"], text)), "ok" if re.search(rule["regex"], text) else "kein Treffer"
    if "count_at_least" in rule:
        s, n = rule["count_at_least"]
        c = text.count(s)
        return c >= n, f"{c} Treffer"
    return False, "unbekannte Regel"


def skill_calls(trace):
    calls, tools = [], []
    for line in open(trace, encoding="utf-8"):
        try:
            e = json.loads(line)
        except ValueError:
            continue
        if e.get("type") == "assistant":
            for b in e["message"].get("content", []):
                if b.get("type") == "tool_use":
                    tools.append(b["name"])
                    if b["name"] == "Skill":
                        calls.append(b["input"].get("skill"))
    return calls, tools


def main():
    fall, ws, trace = sys.argv[1:4]
    f = json.load(open(fall, encoding="utf-8"))
    results = []
    for rule in f.get("checks", []):
        ok, detail = check(rule, ws)
        results.append({"rule": rule, "ok": ok, "detail": detail})
    calls, tools = skill_calls(trace)
    print(json.dumps({"case": f["id"], "skill_calls": calls, "tools": sorted(set(tools)),
                      "checks": results, "passed": sum(r["ok"] for r in results), "total": len(results)},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
