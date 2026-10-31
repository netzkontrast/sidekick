import fs from 'node:fs';

export function* parseFile(path, { delimiter = ',' } = {}) {
  const text = fs.readFileSync(path, 'utf8');
  const lines = text.split('\n');
  for (const line of lines) {
    if (line === '') continue;
    yield splitLine(line, delimiter);
  }
}

function splitLine(line, delimiter) {
  const fields = [];
  let current = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') {
      quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
