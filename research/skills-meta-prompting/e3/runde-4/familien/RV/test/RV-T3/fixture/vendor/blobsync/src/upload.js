import crypto from 'node:crypto';
import fs from 'node:fs';

const MAX_ATTEMPTS = 3;
const DELAY_MS = 100;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function upload(file, options) {
  if (options.debug) console.log('blobsync upload', file, options);
  const body = fs.readFileSync(file);
  const checksum = crypto.createHash('md5').update(body).digest('hex');
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await put(options, file, body, checksum);
      return { etag: res.etag };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleep(DELAY_MS);
    }
  }
}

async function put(options, key, body, checksum) {
  const url = `${options.endpoint}/${options.bucket}/${key}`;
  const res = await fetch(url, { method: 'PUT', body, headers: { 'content-md5': checksum } });
  if (!res.ok) throw new Error(`blobsync: HTTP ${res.status}`);
  return { etag: res.headers.get('etag') };
}
