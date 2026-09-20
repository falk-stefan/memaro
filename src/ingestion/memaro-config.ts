import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { matchesGlob } from './glob.js';

export type MemaroSourceConfig = {
  git: { pull: boolean };
  tags: { path: string; add: string[] }[];
  owner?: string;
  scope?: 'org' | 'team' | 'repo';
};

const DEFAULT_CONFIG: MemaroSourceConfig = {
  git: { pull: false },
  tags: [],
};

/**
 * Loads the optional `.memaro` file at the root of a source directory.
 * Absence is a fully supported case — every field falls back to a safe
 * default (notably `git.pull: false`, even if `.git/` is present).
 */
export const loadMemaroConfig = async (sourceDir: string): Promise<MemaroSourceConfig> => {
  let raw: string;
  try {
    raw = await readFile(path.join(sourceDir, '.memaro'), 'utf-8');
  } catch {
    return DEFAULT_CONFIG;
  }

  const parsed = (parse(raw) ?? {}) as Partial<MemaroSourceConfig>;

  return {
    git: { pull: parsed.git?.pull ?? false },
    tags: parsed.tags ?? [],
    owner: parsed.owner,
    scope: parsed.scope,
  };
};

/** Path-based tags from `.memaro`, in addition to any frontmatter tags. */
export const resolveConfigTags = (config: MemaroSourceConfig, relPath: string): string[] => {
  const posixPath = relPath.split(path.sep).join('/');

  return config.tags
    .filter((rule) => matchesGlob(rule.path, posixPath))
    .flatMap((rule) => rule.add);
};
