import { CHUNK_CHAR_CAP } from './limits.js';

export type Chunk = {
  headingPath: string[];
  text: string;
  embeddingText: string;
};

type Section = {
  headingPath: string[];
  body: string;
};

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

// Splits markdown into one section per heading, each carrying only the body
// text directly under it (not its subsections' bodies) plus the full
// breadcrumb of headings above it.
const splitIntoSections = (content: string): Section[] => {
  const lines = content.split(/\r?\n/);
  const sections: Section[] = [];
  const stack: { level: number; title: string }[] = [];
  let bodyLines: string[] = [];

  const flush = () => {
    const body = bodyLines.join('\n').trim();
    if (body) {
      sections.push({ headingPath: stack.map((s) => s.title), body });
    }
    bodyLines = [];
  };

  for (const line of lines) {
    const match = HEADING_RE.exec(line);
    if (match) {
      flush();
      const level = match[1]!.length;
      const title = match[2]!.trim();
      while (stack.length && stack[stack.length - 1]!.level >= level) {
        stack.pop();
      }
      stack.push({ level, title });
    } else {
      bodyLines.push(line);
    }
  }
  flush();

  if (sections.length === 0 && content.trim()) {
    sections.push({ headingPath: [], body: content.trim() });
  }

  return sections;
};

const splitByBlankLines = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

const LIST_ITEM_RE = /^\s*([-*+]|\d+\.)\s+/;

const splitByListItems = (text: string): string[] => {
  const lines = text.split('\n');
  const items: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (LIST_ITEM_RE.test(line) && current.length) {
      items.push(current.join('\n').trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) items.push(current.join('\n').trim());

  return items.filter(Boolean);
};

const splitBySentences = (text: string): string[] => {
  const parts = text.match(/[^.!?]+[.!?]+(\s+|$)/g);
  return parts ? parts.map((p) => p.trim()).filter(Boolean) : [text];
};

const hardSplit = (text: string, cap: number): string[] => {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += cap) {
    out.push(text.slice(i, i + cap));
  }
  return out;
};

const SPLITTERS = [splitByBlankLines, splitByListItems, splitBySentences];

// Recursively narrows text until every piece is under the cap, trying
// coarser boundaries (paragraph, then list item, then sentence) before
// falling back to a hard character split — this is what still bounds a
// single huge paragraph with no natural break points.
const splitPiece = (text: string, cap: number, splitterIndex: number): string[] => {
  if (text.length <= cap) return [text];

  if (splitterIndex >= SPLITTERS.length) {
    return hardSplit(text, cap);
  }

  const pieces = SPLITTERS[splitterIndex]!(text);
  if (pieces.length <= 1) {
    return splitPiece(text, cap, splitterIndex + 1);
  }

  const result: string[] = [];
  let buffer = '';

  for (const piece of pieces) {
    if (piece.length > cap) {
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      result.push(...splitPiece(piece, cap, splitterIndex + 1));
      continue;
    }

    const candidate = buffer ? `${buffer}\n\n${piece}` : piece;
    if (candidate.length <= cap) {
      buffer = candidate;
    } else {
      if (buffer) result.push(buffer);
      buffer = piece;
    }
  }
  if (buffer) result.push(buffer);

  return result;
};

export const chunkText = (text: string, cap: number = CHUNK_CHAR_CAP): string[] =>
  splitPiece(text.trim(), cap, 0);

// Turns a whole document's markdown body into embeddable chunks. Each chunk
// keeps its raw text separate from the heading-breadcrumb-prefixed text used
// for embedding, so read_instructions can return clean content while search
// quality still benefits from the surrounding context.
export const chunkDocument = (content: string, cap: number = CHUNK_CHAR_CAP): Chunk[] => {
  const sections = splitIntoSections(content);
  const chunks: Chunk[] = [];

  for (const section of sections) {
    const breadcrumb = section.headingPath.join(' > ');
    for (const piece of chunkText(section.body, cap)) {
      chunks.push({
        headingPath: section.headingPath,
        text: piece,
        embeddingText: breadcrumb ? `${breadcrumb}\n\n${piece}` : piece,
      });
    }
  }

  return chunks;
};
