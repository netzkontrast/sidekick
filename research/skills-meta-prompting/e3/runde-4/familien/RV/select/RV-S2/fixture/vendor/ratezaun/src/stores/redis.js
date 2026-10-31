export class RedisStore {
  constructor(client) {
    this.client = client;
  }

  async increment(key, ttlMs) {
    throw new Error('RedisStore: not implemented yet');
  }
}
