export type SparseVector = {
  indices: number[];
  values: number[];
};

// Small, deliberately conservative — the point is to strip near-universal
// words, not to build a real stopword list.
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'then',
  'else',
  'for',
  'of',
  'to',
  'in',
  'on',
  'at',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'as',
  'with',
  'by',
  'from',
  // wh-question and other function words common in natural-language
  // queries but carrying no topical signal — without these, a query like
  // "what is the weather like" can spuriously match any document that
  // happens to contain the word "what" for unrelated reasons.
  'what',
  'when',
  'where',
  'who',
  'whom',
  'why',
  'how',
  'which',
  'do',
  'does',
  'did',
  'doing',
  'have',
  'has',
  'had',
  'having',
  'will',
  'would',
  'should',
  'could',
  'can',
  'may',
  'might',
  'must',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
  'not',
  'no',
  'so',
  'about',
  'into',
  'over',
  'under',
]);

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 1 && !STOPWORDS.has(token)) ?? [];

// Deterministic 30-bit hash — avoids maintaining a growing vocabulary table
// while still mapping any given token to a stable index every time.
const HASH_SPACE = 2 ** 30;

const hashToken = (token: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % HASH_SPACE;
};

// The keyword half of hybrid search (Milestone 1, Iteration 4): a hashed
// term-frequency vector, not full BM25 — good enough to reliably surface an
// exact term (e.g. "TypeScript") that dense embedding similarity alone can
// under-rank, without adding a tokenizer/vocabulary service.
export const sparseVector = (text: string): SparseVector => {
  const counts = new Map<number, number>();

  for (const token of tokenize(text)) {
    const index = hashToken(token);
    counts.set(index, (counts.get(index) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => a[0] - b[0]);

  return {
    indices: entries.map(([index]) => index),
    values: entries.map(([, count]) => 1 + Math.log(count)),
  };
};
