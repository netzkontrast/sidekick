import { escapeHtml } from './escape.js';

const DEFAULTS = { escape: false };

export function render(template, data, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = data[key] ?? '';
    return opts.escape ? escapeHtml(value) : String(value);
  });
}
