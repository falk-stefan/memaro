import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL ?? 'http://127.0.0.1:6333',
});

// Milestone 1, Iteration 3 swapped embed() to nomic-embed-text-v1.5
// (768 dims), replacing all-MiniLM-L6-v2 (384 dims). `memory`/`tag` are
// recreated at 768 dims here rather than left at 384 — safe only because
// neither held real data yet (see Iteration 2's deferral note); doing this
// after Milestone 4 exists would mean re-embedding live memories instead.
const VECTOR_SIZE = 768;

const ensureCollection = async (name: string): Promise<void> => {
  const { collections } = await qdrantClient.getCollections();
  const existing = collections.find((collection) => collection.name === name);

  if (existing) {
    const info = await qdrantClient.getCollection(name);
    const vectors = info.config.params.vectors;
    const currentSize =
      typeof vectors === 'object' && vectors !== null && 'size' in vectors
        ? (vectors as { size: number }).size
        : undefined;

    if (currentSize === VECTOR_SIZE) {
      return;
    }

    await qdrantClient.deleteCollection(name);
  }

  await qdrantClient.createCollection(name, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
  });
};

// `instruction` carries two named vectors, not one: `dense` (semantic
// similarity) and `sparse` (hashed keyword match) — Milestone 1, Iteration
// 4's hybrid search fuses results from both. `memory`/`tag` only ever need
// dense similarity, so they stay single unnamed vectors.
const ensureInstructionCollection = async (): Promise<void> => {
  const { collections } = await qdrantClient.getCollections();
  const existing = collections.find((collection) => collection.name === 'instruction');

  if (existing) {
    const info = await qdrantClient.getCollection('instruction');
    const vectors = info.config.params.vectors;
    const hasNamedDense =
      typeof vectors === 'object' &&
      vectors !== null &&
      'dense' in vectors &&
      (vectors as unknown as { dense: { size: number } }).dense?.size === VECTOR_SIZE;
    const hasSparse = !!info.config.params.sparse_vectors?.['sparse'];

    if (hasNamedDense && hasSparse) {
      return;
    }

    await qdrantClient.deleteCollection('instruction');
  }

  await qdrantClient.createCollection('instruction', {
    vectors: { dense: { size: VECTOR_SIZE, distance: 'Cosine' } },
    sparse_vectors: { sparse: {} },
  });
};

await ensureCollection('memory');
await ensureCollection('tag');
await ensureInstructionCollection();
