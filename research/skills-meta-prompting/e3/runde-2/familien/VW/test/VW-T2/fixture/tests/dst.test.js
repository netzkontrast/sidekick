// Reproduktion für zeitwerk-tz #12: Termin am Tag nach der Zeitumstellung
const test = require("node:test");
const assert = require("node:assert");
const { toZone } = require("zeitwerk-tz");

test(
  "09:00 Ortszeit am 26.10.2026 bleibt 09:00",
  { todo: "zeitwerk-tz #12, mit 2.3 rot (siehe HANDOFF.md)" },
  () => {
    const local = toZone("2026-10-26T08:00:00Z", "Europe/Berlin");
    assert.strictEqual(local.format("YYYY-MM-DD HH:mm"), "2026-10-26 09:00");
  }
);
