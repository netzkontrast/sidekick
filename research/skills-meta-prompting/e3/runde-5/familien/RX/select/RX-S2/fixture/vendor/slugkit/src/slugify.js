import { DEFAULTS } from './options.js';

export function slugify(title, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  let s = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (opts.lowercase) s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/gi, opts.separator);
  s = s.replace(new RegExp(`^${opts.separator}|${opts.separator}$`, 'g'), '');
  return s.slice(0, opts.maxLength);
}
