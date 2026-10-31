// Registry record checks (SLV0-VAL-16, SLV0-PKG-10…15, -24). Reads given files only; never
// corrects a record and never writes `status` (SLV0-INV-01).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HASH_PROFILE, compareCodepoints, sortMessages } from './core.js';
import { validateSchema } from './schema.js';
import { validatePackage, msg } from './package.js';

export const DEFAULT_SCHEMA_PATH = fileURLToPath(new URL('../../../docs/spec/schemas/skill-package.schema.json', import.meta.url));

export function loadSchema(schemaPath = DEFAULT_SCHEMA_PATH) {
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

/**
 * Check registry records.
 * @param {Array<{display:string, text:string}>} inputs record files (display path + content)
 * @param {{schema:object, repoRoot:string|null, schemaOnly:boolean}} opts
 */
export function checkRegistry(inputs, { schema, repoRoot = null, schemaOnly = false }) {
  const messages = [];
  const records = [];
  const hashCache = new Map();
  for (const { display, text } of inputs) {
    const entry = { path: display, skill_id: null, version: null, schema_valid: false, hash_checked: false, computed_hash: null };
    records.push(entry);
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      messages.push(msg('registry_invalid', display, null, `kein gültiges JSON: ${err.message}`));
      continue;
    }
    const errs = validateSchema(schema, data);
    for (const e of errs) messages.push(msg('registry_invalid', display, null, `${e.pointer}: ${e.message}`));
    if (errs.length > 0) continue;
    entry.schema_valid = true;
    entry.skill_id = data.skill_id;
    entry.version = data.version;
    entry.content_hash = data.content_hash;
    const folder = data.package_path.split('/').pop();
    if (folder !== data.skill_id) {
      messages.push(msg('registry_invalid', display, null, `skill_id (${data.skill_id}) ungleich Paketordner in package_path (${folder}) (SLV0-PKG-11)`));
      entry.schema_valid = false;
      continue;
    }
    if (schemaOnly || repoRoot === null) continue;
    if (data.content_hash.profile !== HASH_PROFILE) {
      messages.push(msg('registry_invalid', display, null, `Hash-Profil ${data.content_hash.profile} wird nicht unterstützt; Hashes verschiedener Profile werden nicht verglichen (SLV0-PKG-24)`));
      continue;
    }
    if (!hashCache.has(data.package_path)) {
      const abs = path.join(repoRoot, ...data.package_path.split('/'));
      let computed = null;
      let reason = null;
      try {
        fs.lstatSync(abs);
        const res = validatePackage(abs, { display: data.package_path, folderName: folder });
        computed = res.content_hash;
        if (!computed) reason = 'Paket ist ungültig und erhält keinen Hash (validate ausführen)';
      } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') throw err;
        reason = 'Paketordner fehlt';
      }
      hashCache.set(data.package_path, { computed, reason });
    }
    const { computed, reason } = hashCache.get(data.package_path);
    entry.hash_checked = true;
    entry.computed_hash = computed;
    if (computed === null) {
      messages.push(msg('hash_mismatch', display, null, `kein berechenbarer Inhaltshash für ${data.package_path}: ${reason}`));
    } else if (computed !== data.content_hash.value) {
      messages.push(msg('hash_mismatch', display, null, `content_hash.value ${data.content_hash.value} ungleich berechnet ${computed}`));
    }
  }
  // Same skill_id + version with different hash (SLV0-INV-02, SLV0-VAL-16).
  const groups = new Map();
  for (const r of records) {
    if (!r.schema_valid) continue;
    const key = `${r.skill_id}@${r.version}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  for (const [key, list] of groups) {
    const hashes = new Set(list.map((r) => `${r.content_hash.profile}:${r.content_hash.value}`));
    if (hashes.size > 1) {
      const others = list.map((r) => r.path).sort(compareCodepoints);
      for (const r of list) {
        messages.push(msg('version_hash_conflict', r.path, null, `${key} hat verschiedene Hashes in ${others.join(', ')}`));
      }
    }
  }
  for (const r of records) delete r.content_hash;
  return { records, messages: sortMessages(messages) };
}
