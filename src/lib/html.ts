/**
 * Decode common HTML entities returned by the WordPress REST API
 * (e.g. `&#8211;` → `–`, `&amp;` → `&`, `&#x27;` → `'`).
 * Safe for SSR — does not rely on the DOM.
 */
export function decodeEntities(input: string): string {
  if (!input) return input;
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
    hellip: "…",
    ndash: "–",
    mdash: "—",
    lsquo: "‘",
    rsquo: "’",
    ldquo: "“",
    rdquo: "”",
  };
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => named[name] ?? m);
}
