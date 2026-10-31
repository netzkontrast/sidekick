// blattwerk 0.14 – liest den Frontmatter-Block am Anfang einer Markdown-Datei
function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 1) continue; // Zeilen ohne Schlüssel werden übersprungen
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] =
      key === "tags"
        ? value.split(",").map((t) => t.trim()).filter(Boolean)
        : value;
  }
  return data;
}

module.exports = { parseFrontmatter };
