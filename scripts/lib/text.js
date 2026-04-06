function cleanJsonText(rawText) {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : rawText;
  return source.trim();
}

function parseBullets(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function parseFirstHeading(markdown) {
  const line = markdown
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith("# "));
  return line ? line.replace(/^#\s+/, "").trim() : "";
}

module.exports = {
  cleanJsonText,
  parseBullets,
  parseFirstHeading
};
