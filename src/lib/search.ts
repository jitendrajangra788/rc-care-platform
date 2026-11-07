export type SearchHit = {
  id: string;
  type: "patient" | "booking" | "staff" | "lead" | "invoice";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

export function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export function normSearch(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Website-style match: partial text + phone digits (ignores +91 / spaces / dashes). */
export function recordMatches(query: string, ...parts: Array<string | number | undefined | null>) {
  const q = normSearch(query);
  if (!q) return true;
  const hay = normSearch(parts.filter((p) => p != null && String(p).trim()).join(" "));
  const hayDigits = digitsOnly(hay);
  const qDigits = digitsOnly(q);

  if (qDigits.length >= 2 && hayDigits.includes(qDigits)) return true;

  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((token) => {
    if (hay.includes(token)) return true;
    // Single akshar / letter: match word starts or contains
    if (token.length === 1) {
      return hay.split(/[^a-z0-9]+/).some((w) => w.startsWith(token) || w.includes(token));
    }
    const td = digitsOnly(token);
    return td.length >= 2 && hayDigits.includes(td);
  });
}

export function scoreHit(query: string, hit: SearchHit): number {
  const q = normSearch(query);
  if (!q) return 0;
  const title = normSearch(hit.title);
  const id = normSearch(hit.id);
  const keywords = normSearch(hit.keywords);
  const qDigits = digitsOnly(q);
  const keyDigits = digitsOnly(hit.keywords);
  const words = title.split(/[^a-z0-9]+/).filter(Boolean);

  if (id === q || title === q) return 100;
  if (id.startsWith(q) || title.startsWith(q)) return 95;
  // Hospital EHR style: one letter still matches name tokens (S → Suresh)
  if (words.some((w) => w.startsWith(q))) return 92;
  if (qDigits.length >= 1 && keyDigits.startsWith(qDigits) && qDigits.length >= 2) return 88;
  if (title.includes(q) || id.includes(q)) return 75;
  if (qDigits.length >= 2 && keyDigits.includes(qDigits)) return 70;
  if (keywords.includes(q)) return 55;
  if (words.some((w) => w.includes(q))) return 50;
  if (recordMatches(q, hit.keywords, hit.title, hit.subtitle, hit.id)) return 40;
  return 0;
}

export function filterSearchHits(hits: SearchHit[], query: string, limit = 40): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  return hits
    .map((hit) => ({ hit, score: scoreHit(q, hit) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title))
    .slice(0, limit)
    .map((row) => row.hit);
}

/** Highlight query matches inside label text for typeahead UI. */
export function splitHighlight(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim();
  if (!q || !text) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx >= 0) {
    return [
      { text: text.slice(0, idx), hit: false },
      { text: text.slice(idx, idx + needle.length), hit: true },
      { text: text.slice(idx + needle.length), hit: false },
    ].filter((p) => p.text);
  }
  const qd = digitsOnly(q);
  if (qd.length >= 3) {
    const td = digitsOnly(text);
    if (td.includes(qd)) return [{ text, hit: true }];
  }
  return [{ text, hit: false }];
}
