import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ContentSource, RawDoc } from './content-source.js';
import { parseFrontmatter } from './frontmatter.js';
import { loadMemaroConfig, MemaroSourceConfig, resolveConfigTags } from './memaro-config.js';

const IGNORED_DIR_NAMES = new Set(['.git', 'node_modules']);

/**
 * Reads every markdown file under `data/<sourceName>/`. Never assumes the
 * directory is a git checkout, and never performs a git operation itself —
 * see `.memaro`'s `git.pull` (default false) for the opt-in exception,
 * which a future iteration acts on; this adapter only reads what's already
 * on disk.
 */
export class LocalDirectorySource implements ContentSource {
  readonly id: string;

  constructor(
    private readonly sourceDir: string,
    sourceName: string,
  ) {
    this.id = `local:${sourceName}`;
  }

  supportsWebhook(): boolean {
    return false;
  }

  async *listDocuments(): AsyncIterable<RawDoc> {
    const config = await loadMemaroConfig(this.sourceDir);

    for await (const relPath of walkMarkdownFiles(this.sourceDir)) {
      yield await this.toRawDoc(relPath, config);
    }
  }

  async fetchDocument(externalId: string): Promise<RawDoc> {
    const config = await loadMemaroConfig(this.sourceDir);
    return this.toRawDoc(externalId, config);
  }

  private async toRawDoc(relPath: string, config: MemaroSourceConfig): Promise<RawDoc> {
    const absPath = path.join(this.sourceDir, relPath);
    const raw = await readFile(absPath, 'utf-8');
    const { data, body } = parseFrontmatter(raw);
    const fileStat = await stat(absPath);

    const frontmatterTags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const tags = [...new Set([...frontmatterTags, ...resolveConfigTags(config, relPath)])];

    return {
      externalId: relPath,
      title: typeof data.title === 'string' ? data.title : path.basename(relPath, '.md'),
      content: body,
      tags,
      owner: typeof data.owner === 'string' ? data.owner : config.owner,
      scope: (typeof data.scope === 'string' ? data.scope : config.scope) as RawDoc['scope'],
      lastReviewed: parseLastReviewed(data.lastReviewed),
      lastModified: fileStat.mtime,
      sourceUrl: `file://${absPath}`,
      contentHash: createHash('sha256').update(raw).digest('hex'),
      acl: null,
    };
  }
}

// YAML parses an unquoted date like `2026-08-01` as a Date already; a
// quoted string needs an explicit parse. Anything else is absent.
function parseLastReviewed(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

async function* walkMarkdownFiles(rootDir: string, relDir = ''): AsyncGenerator<string> {
  const entries = await readdir(path.join(rootDir, relDir), { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const relPath = path.join(relDir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      yield* walkMarkdownFiles(rootDir, relPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield relPath;
    }
  }
}
