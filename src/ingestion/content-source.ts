/**
 * Source-agnostic ingestion contract (Milestone 1, Iteration 2).
 *
 * Everything downstream of ingestion (instruction_doc, chunking, embedding,
 * read_instructions) only ever sees a RawDoc — never a git path, a directory
 * entry, or a future Confluence page ID directly.
 */

export type AclHint = {
  visibility: 'public' | 'restricted';
} | null;

export type RawDoc = {
  externalId: string; // opaque outside the adapter — e.g. a relative file path
  title: string;
  content: string; // normalized to plain text/markdown by the adapter
  tags?: string[]; // adapter-derived tags (frontmatter + source config rules)
  owner?: string; // optional — not every source has this natively
  scope?: 'org' | 'team' | 'repo';
  lastReviewed?: Date; // human-asserted "still accurate as of" date, from frontmatter
  lastModified?: Date;
  sourceUrl: string;
  contentHash: string; // sha256 of the raw file content, used for change detection
  acl: AclHint;
};

export interface ContentSource {
  id: string; // e.g. "local:agent-instructions"
  listDocuments(): AsyncIterable<RawDoc>;
  fetchDocument(externalId: string): Promise<RawDoc>;
  supportsWebhook(): boolean; // else memaro polls / is manually re-scanned
}
