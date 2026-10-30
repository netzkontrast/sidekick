#!/usr/bin/env python3
"""Research helper: freeze inputs, prepare workspaces and normalize CLI traces.

Does not launch a model, install clients, activate skills or infer quality scores.
Python standard library only. Live execution belongs to a verified client environment.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile

VERSION = "skill-pilot-v1"


def digest(value):
    data = value.encode("utf-8") if isinstance(value, str) else value
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent,
                                     delete=False) as tmp:
        tmp.write(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
        temp = Path(tmp.name)
    os.replace(temp, path)


def safe_path(root, relative):
    rel = PurePosixPath(relative)
    if rel.is_absolute() or ".." in rel.parts or "\\" in relative:
        raise ValueError("unsafe relative path")
    root = Path(root).resolve()
    dest = root.joinpath(*rel.parts)
    if not dest.resolve().is_relative_to(root):
        raise ValueError("path escapes workspace")
    return dest


def verify_snapshot(snapshot):
    if snapshot.get("schema_version") != 1:
        raise ValueError("unsupported snapshot")
    for path, record in snapshot["files"].items():
        safe_path(Path.cwd(), path)
        if not path.startswith(".agents/skills/"):
            raise ValueError("unexpected source path")
        if digest(record["content"]) != record["sha256"]:
            raise ValueError("snapshot hash mismatch: " + path)
    expected = digest(canonical({p: r["sha256"]
                                for p, r in sorted(snapshot["files"].items())}))
    if expected != snapshot["package_set_sha256"]:
        raise ValueError("snapshot set hash mismatch")
    return snapshot


def freeze(source):
    files = {p: {"content": c, "sha256": digest(c)}
             for p, c in sorted(source["files"].items())}
    return {
        "schema_version": 1,
        "source_commit": source["source_commit"],
        "files": files,
        "package_set_sha256": digest(canonical({p: r["sha256"] for p, r in files.items()})),
    }


def variant_files(snapshot, candidate=None):
    verify_snapshot(snapshot)
    files = {p: r["content"] for p, r in snapshot["files"].items()}
    if candidate is None:
        return files
    if candidate["baseline_sha256"] != snapshot["package_set_sha256"]:
        raise ValueError("candidate belongs to another baseline")
    if candidate["dimension"] == "description" and len(candidate["replacements"]) != 1:
        raise ValueError("description candidate must change exactly one line")
    if candidate["dimension"] not in ("description", "project-binding"):
        raise ValueError("unknown candidate dimension")
    for change in candidate["replacements"]:
        path = change["path"]
        if path not in files:
            raise ValueError("candidate changes an unknown file")
        before, after = change["before"], change["after"]
        if files[path].count(before) != 1:
            raise ValueError("replacement is not unique")
        if candidate["dimension"] == "description":
            if (not path.endswith("/SKILL.md") or not before.startswith("description:")
                    or not after.startswith("description:") or "\n" in after):
                raise ValueError("description candidate changes non-description")
        files[path] = files[path].replace(before, after, 1)
    return files


def doctor():
    cli = shutil.which("claude")
    result = {
        "helper_version": VERSION, "cli_path": cli,
        "model_starts": 0, "auth_probed": False,
        "status": "blocked_missing_client" if not cli else "local_help_checked",
        "live_ready": False,
        "reason": "Claude CLI not found" if not cli else
                  "Catalog, activation trace, auth and isolation still need live C0",
    }
    if cli:
        for flag in ("--version", "--help"):
            try:
                run = subprocess.run([cli, flag], text=True, capture_output=True, timeout=15)
                # Only documented command output; never inspect credential files or environment.
                result[flag[2:]] = {"exit_code": run.returncode, "output": run.stdout[:24000]}
            except (OSError, subprocess.TimeoutExpired) as exc:
                result[flag[2:]] = {"error": type(exc).__name__}
    return result


def prepare(snapshot, candidates, cases, output):
    verify_snapshot(snapshot)
    output = Path(output)
    if output.exists():
        raise ValueError("output already exists; use a fresh workspace")
    output.mkdir(parents=True)
    by_id = {c["id"]: c for c in candidates}
    if len(by_id) != len(candidates):
        raise ValueError("duplicate candidate id")
    for candidate in candidates:
        variant_files(snapshot, candidate)
    trials = []
    for case in cases:
        if not case["id"] or not case["family_id"]:
            raise ValueError("case identity missing")
        for variant in case.get("variants", ["B1"]):
            if variant not in ("B0", "B1") and variant not in by_id:
                raise ValueError("unknown trial variant")
            trial_id = case["id"] + "--" + variant
            root = safe_path(output, trial_id)
            root.mkdir()
            # Same explicit task configuration in every arm, no autodiscovered rules.
            config = "Projektkonfiguration: Fragenablage docs/fragen/. Nur synthetische Daten.\n\n"
            if variant != "B0":
                files = variant_files(snapshot, by_id.get(variant))
                for path, content in files.items():
                    dest = safe_path(root, path)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_text(content, encoding="utf-8")
                skill_names = sorted({Path(p).parts[2] for p in files})
                client_dir = root / ".claude/skills"
                client_dir.mkdir(parents=True)
                for name in skill_names:
                    (client_dir / name).symlink_to(root / ".agents/skills" / name,
                                                   target_is_directory=True)
            for path, content in case.get("files", {}).items():
                if path.startswith((".claude/", ".agents/")) or path in ("AGENTS.md", "CLAUDE.md"):
                    raise ValueError("case overwrites experiment configuration")
                dest = safe_path(root, path)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(content, encoding="utf-8")
            trials.append({
                "trial_id": trial_id, "case_id": case["id"], "family_id": case["family_id"],
                "variant": variant, "workspace": str(root.resolve()),
                "prompt": config + case["prompt"], "allowed_skills": case["allowed_skills"],
                "project_configuration_sha256": digest(config),
                "case_sha256": digest(canonical(case)),
                "baseline_sha256": snapshot["package_set_sha256"],
                "candidate_sha256": digest(canonical(by_id[variant])) if variant in by_id else None,
                "planned_only": True,
            })
    ids = [t["trial_id"] for t in trials]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate trial ids")
    manifest = {"helper_version": VERSION, "model_starts": 0, "trials": trials}
    write_json(output / "trials.json", manifest)
    return manifest


def normalize_trace(text):
    events = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError("invalid JSONL line " + str(number)) from exc
        if not isinstance(event, dict):
            raise ValueError("event must be an object")
        events.append(event)
    init = next((e for e in events if e.get("type") == "system"
                 and e.get("subtype") == "init"), None)
    requests, results = {}, {}
    for event in events:
        message = event.get("message", event)
        if not isinstance(message, dict):
            continue
        content = message.get("content", [])
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "tool_use":
                tool, data = block.get("name"), block.get("input") or {}
                if tool == "Skill":
                    skill = data.get("skill")
                    requests[block["id"]] = {"mode": "skill_tool", "skill": skill}
                elif tool == "Read":
                    path = data.get("file_path", "")
                    match = re.search(r"(?:^|/)(?:\.agents|\.claude)/skills/([^/]+)/SKILL\.md$", path)
                    if match:
                        requests[block["id"]] = {"mode": "file_read", "skill": match.group(1)}
            elif block.get("type") == "tool_result":
                # A request alone is not successful activation.
                results[block.get("tool_use_id")] = not block.get("is_error", False)
    activations = [
        {**record, "tool_use_id": key, "confirmed": results.get(key)}
        for key, record in requests.items()
    ]
    final = next((e for e in reversed(events) if e.get("type") == "result"), None)
    status = "completed" if final and not final.get("is_error", False) else "incomplete_or_error"
    return {
        "helper_version": VERSION, "trace_sha256": digest(text), "status": status,
        "catalog_observed": bool(init and isinstance(init.get("skills"), list)),
        "visible_skills": init.get("skills") if init else None,
        "visible_tools": init.get("tools") if init else None,
        "visible_plugins": init.get("plugins") if init else None,
        "activation_evidence": activations,
        "activation_observability": "events_observed" if activations else "not_established",
        "absence_is_proven": False,
        "usage": final.get("usage") if final else None,
        "reported_cost_usd": final.get("total_cost_usd") if final else None,
        "reported_model": init.get("model") if init else None,
        "quality_scored": False,
    }


def record_start(ledger_path, trial_id, limit=40):
    if not 1 <= limit <= 40:
        raise ValueError("limit must be between 1 and 40")
    ledger_path = Path(ledger_path)
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    lock = Path(str(ledger_path) + ".lock")
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        os.close(fd)
        ledger = read_json(ledger_path) if ledger_path.exists() else {"starts": []}
        if len(ledger["starts"]) >= limit:
            raise ValueError("CLI-start budget exhausted")
        attempt = {"attempt_id": len(ledger["starts"]) + 1, "trial_id": trial_id,
                   "status": "reserved_before_start"}
        ledger["starts"].append(attempt)
        write_json(ledger_path, ledger)
        return attempt
    finally:
        lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["doctor", "freeze", "prepare", "normalize", "record-start"])
    parser.add_argument("--source")
    parser.add_argument("--snapshot")
    parser.add_argument("--candidates")
    parser.add_argument("--cases")
    parser.add_argument("--trace")
    parser.add_argument("--trial-id")
    parser.add_argument("--ledger")
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.command == "doctor":
        value = doctor()
    elif args.command == "freeze":
        value = freeze(read_json(args.source))
    elif args.command == "prepare":
        manifest = prepare(read_json(args.snapshot), read_json(args.candidates)["candidates"],
                           read_json(args.cases)["cases"], args.output)
        print(canonical({"prepared_trials": len(manifest["trials"]), "model_starts": 0}))
        return
    elif args.command == "normalize":
        value = normalize_trace(Path(args.trace).read_text(encoding="utf-8"))
    else:
        value = record_start(args.ledger, args.trial_id, args.limit)
    write_json(args.output, value)
    print(canonical({"command": args.command, "output": args.output}))


if __name__ == "__main__":
    main()

