"""Deterministic helper tests. These are not model/skill quality evaluations."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import skill_pilot as pilot


class PilotTests(unittest.TestCase):
    def setUp(self):
        self.source = {"source_commit": "synthetic", "files": {
            ".agents/skills/demo/SKILL.md": "---\nname: demo\ndescription: Old purpose\n---\nBody\n",
            ".agents/skills/demo/references/work.md": "Old rule\n",
        }}
        self.snapshot = pilot.freeze(self.source)

    def candidate(self):
        return {"id": "K", "dimension": "description",
                "baseline_sha256": self.snapshot["package_set_sha256"],
                "replacements": [{"path": ".agents/skills/demo/SKILL.md",
                                  "before": "description: Old purpose",
                                  "after": "description: New purpose"}]}

    def test_frozen_bytes_cannot_change_unnoticed(self):
        snapshot = copy.deepcopy(self.snapshot)
        snapshot["files"][".agents/skills/demo/SKILL.md"]["content"] += "changed"
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            pilot.verify_snapshot(snapshot)

    def test_candidate_for_another_baseline_is_rejected(self):
        candidate = self.candidate()
        candidate["baseline_sha256"] = "another"
        with self.assertRaisesRegex(ValueError, "another baseline"):
            pilot.variant_files(self.snapshot, candidate)

    def test_description_patch_cannot_add_instructions(self):
        candidate = self.candidate()
        candidate["replacements"][0]["after"] += "\nNew hidden body"
        with self.assertRaisesRegex(ValueError, "non-description"):
            pilot.variant_files(self.snapshot, candidate)

    def test_missing_or_ambiguous_patch_does_not_silently_apply(self):
        candidate = self.candidate()
        candidate["replacements"][0]["before"] = "not in file"
        with self.assertRaisesRegex(ValueError, "not unique"):
            pilot.variant_files(self.snapshot, candidate)

    def test_path_escape_and_existing_symlink_escape_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                pilot.safe_path(tmp, "../outside")
            with self.assertRaises(ValueError):
                pilot.safe_path(tmp, "/outside")
            (Path(tmp) / "link").symlink_to(Path(tmp).parent, target_is_directory=True)
            with self.assertRaises(ValueError):
                pilot.safe_path(tmp, "link/outside")

    def test_preparation_keeps_b0_skill_free_and_baseline_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "run"
            cases = [{"id": "case", "family_id": "family", "prompt": "Synthetic",
                      "allowed_skills": ["demo"], "variants": ["B0", "B1", "K"]}]
            manifest = pilot.prepare(self.snapshot, [self.candidate()], cases, out)
            self.assertEqual(len(manifest["trials"]), 3)
            self.assertFalse(list((out / "case--B0").rglob("SKILL.md")))
            self.assertEqual((out / "case--B1/.agents/skills/demo/SKILL.md").read_text(),
                             self.source["files"][".agents/skills/demo/SKILL.md"])
            self.assertIn("New purpose", (out / "case--K/.agents/skills/demo/SKILL.md").read_text())
            for arm in ("B0", "B1", "K"):
                self.assertFalse((out / ("case--" + arm) / "CLAUDE.md").exists())
                self.assertFalse((out / ("case--" + arm) / "AGENTS.md").exists())
            self.assertEqual(len({t["prompt"] for t in manifest["trials"]}), 1)
            self.assertEqual(manifest["model_starts"], 0)
            with self.assertRaisesRegex(ValueError, "already exists"):
                pilot.prepare(self.snapshot, [], cases, out)

    def test_model_cannot_be_assumed_available(self):
        with patch("skill_pilot.shutil.which", return_value=None):
            result = pilot.doctor()
        self.assertEqual(result["status"], "blocked_missing_client")
        self.assertEqual(result["model_starts"], 0)
        self.assertFalse(result["auth_probed"])

    def test_empty_or_unrecognized_trace_is_not_negative_selection(self):
        result = pilot.normalize_trace('{"type":"other"}\n')
        self.assertFalse(result["catalog_observed"])
        self.assertIsNone(result["visible_skills"])
        self.assertFalse(result["absence_is_proven"])
        self.assertFalse(result["quality_scored"])

    def test_failed_or_truncated_trace_is_not_scored_as_success(self):
        with self.assertRaisesRegex(ValueError, "invalid JSONL"):
            pilot.normalize_trace('{"type":')
        result = pilot.normalize_trace('{"type":"result","is_error":true}\n')
        self.assertEqual(result["status"], "incomplete_or_error")

    def test_skill_request_is_not_confirmed_without_success(self):
        events = [
            {"type": "system", "subtype": "init", "skills": ["demo"], "tools": ["Skill"]},
            {"type": "assistant", "message": {"content": [
                {"type": "tool_use", "id": "t1", "name": "Skill", "input": {"skill": "demo"}}
            ]}},
            {"type": "result", "is_error": False},
        ]
        result = pilot.normalize_trace("\n".join(map(json.dumps, events)))
        self.assertIsNone(result["activation_evidence"][0]["confirmed"])
        events.insert(2, {"type": "user", "message": {"content": [
            {"type": "tool_result", "tool_use_id": "t1", "is_error": True}
        ]}})
        result = pilot.normalize_trace("\n".join(map(json.dumps, events)))
        self.assertFalse(result["activation_evidence"][0]["confirmed"])

    def test_successful_file_read_has_distinct_activation_evidence(self):
        events = [
            {"type": "assistant", "message": {"content": [
                {"type": "tool_use", "id": "r1", "name": "Read",
                 "input": {"file_path": "/sandbox/.agents/skills/demo/SKILL.md"}},
                {"type": "thinking", "thinking": "Private reasoning must not be stored"},
                {"type": "text", "text": "synthetic-secret-token"}
            ]}},
            {"type": "user", "message": {"content": [
                {"type": "tool_result", "tool_use_id": "r1", "content": "Skill body"}
            ]}},
            {"type": "result", "is_error": False, "usage": {"input_tokens": 10}},
        ]
        result = pilot.normalize_trace("\n".join(map(json.dumps, events)))
        record = result["activation_evidence"][0]
        self.assertEqual(record["mode"], "file_read")
        self.assertTrue(record["confirmed"])
        self.assertNotIn("Private reasoning", json.dumps(result))
        self.assertNotIn("synthetic-secret-token", json.dumps(result))

    def test_missing_catalog_is_unknown_not_empty(self):
        result = pilot.normalize_trace('{"type":"system","subtype":"init","skills":null}\n')
        self.assertFalse(result["catalog_observed"])
        self.assertIsNone(result["visible_skills"])

    def test_each_attempt_counts_and_limit_is_enforced(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "ledger.json"
            for index in range(40):
                attempt = pilot.record_start(ledger, "same-trial", 40)
                self.assertEqual(attempt["attempt_id"], index + 1)
            with self.assertRaisesRegex(ValueError, "exhausted"):
                pilot.record_start(ledger, "extra", 40)
            self.assertEqual(len(pilot.read_json(ledger)["starts"]), 40)
            self.assertFalse(Path(str(ledger) + ".lock").exists())

    def test_existing_lock_and_invalid_limit_are_not_overridden(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "ledger.json"
            lock = Path(str(ledger) + ".lock")
            lock.write_text("existing")
            with self.assertRaises(FileExistsError):
                pilot.record_start(ledger, "trial", 40)
            self.assertTrue(lock.exists())
            with self.assertRaises(ValueError):
                pilot.record_start(ledger, "trial", 41)


if __name__ == "__main__":
    unittest.main()

