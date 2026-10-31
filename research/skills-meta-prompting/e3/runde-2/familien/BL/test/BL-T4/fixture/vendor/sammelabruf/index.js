// sammelabruf 1.5 – lädt viele URLs mit begrenzter Parallelität
async function fetchAll(urls, { concurrency = 4, timeoutMs = 10000 } = {}) {
  const results = new Array(urls.length);
  let next = 0;

  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        results[i] = await fetch(urls[i], { signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

module.exports = { fetchAll };
