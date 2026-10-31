export class MemoryStore {
  constructor() {
    this.counts = new Map();
  }

  async increment(key, ttlMs) {
    const n = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, n);
    if (n === 1) setTimeout(() => this.counts.delete(key), ttlMs).unref();
    return n;
  }
}
