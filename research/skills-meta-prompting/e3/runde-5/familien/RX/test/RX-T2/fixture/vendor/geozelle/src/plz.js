import fs from 'node:fs';

const ROWS = fs.readFileSync(new URL('../data/plz-zentren.csv', import.meta.url), 'utf8')
  .trim().split('\n').slice(1).map((l) => l.split(','));

export function plzZentrum(plz) {
  const row = ROWS.find((r) => r[0] === plz);
  return row ? { lat: Number(row[1]), lon: Number(row[2]) } : null;
}
