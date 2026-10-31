const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, (ch) => MAP[ch]);
}
