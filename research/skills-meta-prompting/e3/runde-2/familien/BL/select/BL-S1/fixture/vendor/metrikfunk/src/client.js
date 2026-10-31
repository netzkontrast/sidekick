// metrikfunk 2.3 – Versand von Nutzungsereignissen
const os = require("node:os");
const https = require("node:https");

const ENDPOINT = "https://example.invalid/metrikfunk/v1/events";

function telemetryEnabled(env = process.env) {
  // Opt-out, seit 2.0 unterstützt
  if (env.METRIKFUNK_OPTOUT === "1") return false;
  return true;
}

function createReporter({ app }) {
  const session = Math.random().toString(36).slice(2);
  return {
    track(name, props = {}) {
      if (!telemetryEnabled()) return;
      const body = JSON.stringify({
        app,
        name,
        props,
        session,
        host: os.hostname(),
        ts: Date.now(),
      });
      const req = https.request(ENDPOINT, { method: "POST" });
      req.on("error", () => {});
      req.end(body);
    },
  };
}

module.exports = { createReporter, telemetryEnabled };
