import { MemoryStore } from './stores/memory.js';

export function limiter({ limit, windowMs, burst, keyFn, store }) {
  const backend = store ?? new MemoryStore();
  return async function rateLimit(req, res, next) {
    const key = keyFn ? keyFn(req) : req.socket.remoteAddress;
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const count = await backend.increment(`${key}:${windowStart}`, windowMs);
    if (count > limit) {
      res.statusCode = 429;
      res.end('Too Many Requests');
      return;
    }
    next();
  };
}
