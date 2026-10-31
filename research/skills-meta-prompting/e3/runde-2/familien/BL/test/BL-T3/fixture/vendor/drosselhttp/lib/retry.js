// drosselhttp 4.2 – Wiederholungslogik
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

// Exponentielles Backoff mit Jitter; ein Retry-After des Servers hat Vorrang.
function delayFor(attempt) {
  return BASE_DELAY_MS + Math.floor(Math.random() * 50);
}

function shouldRetry(status) {
  return status === 502 || status === 503;
}

async function withRetry(send) {
  let res = await send();
  for (let attempt = 1; attempt <= MAX_RETRIES && shouldRetry(res.status); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delayFor(attempt)));
    res = await send();
  }
  return res;
}

module.exports = { withRetry, shouldRetry, delayFor, MAX_RETRIES, BASE_DELAY_MS };
