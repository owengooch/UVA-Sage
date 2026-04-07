/**
 * Expand catalog tag strings for UI: Hooslist often stores one PascalCase blob per tag;
 * comma-separated lists are split; simple tokens stay as one label.
 */
function splitPascalOrCamelWords(s: string): string[] {
  const words = s
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words;
}

function displayTagParts(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];

  if (t.includes(",") || t.includes(";")) {
    return t
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap(displayTagParts);
  }

  const looksLikeCompoundBlob = /[a-z][A-Z]/.test(t) || /^[A-Z][a-z]+(?:[A-Z][a-z]+)+/.test(t);
  if (looksLikeCompoundBlob && t.length > 3) {
    return splitPascalOrCamelWords(t);
  }

  return [t];
}

/** Labels to show as individual chips (order preserved, duplicates kept like source). */
export function expandedCourseTagLabels(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  return tags.flatMap(displayTagParts);
}
