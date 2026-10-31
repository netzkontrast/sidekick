import fs from 'node:fs';

export class Stash {
  constructor({ file }) {
    this.file = file;
    this.data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    this.dirty = false;
  }

  set(key, value, { ttl } = {}) {
    const expires = ttl ? Date.now() + ttl : null;
    this.data[key] = { value, expires };
    this.dirty = true;
  }

  get(key) {
    const entry = this.data[key];
    if (!entry) return undefined;
    if (entry.expires !== null && entry.expires < Date.now()) {
      delete this.data[key];
      return undefined;
    }
    return entry.value;
  }

  flush() {
    if (!this.dirty) return;
    fs.writeFileSync(this.file, JSON.stringify(this.data));
    this.dirty = false;
  }
}
