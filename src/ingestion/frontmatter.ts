import { parse } from 'yaml';

export type Frontmatter = {
  data: Record<string, unknown>;
  body: string;
};

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Splits a `---\nyaml\n---\nbody` document into its frontmatter and body.
 * A document with no frontmatter block is returned with empty data.
 */
export const parseFrontmatter = (raw: string): Frontmatter => {
  const match = FRONTMATTER_PATTERN.exec(raw);

  if (!match) {
    return { data: {}, body: raw };
  }

  const [, yamlBlock, body] = match;
  const data = (parse(yamlBlock ?? '') ?? {}) as Record<string, unknown>;

  return { data, body: body ?? '' };
};
