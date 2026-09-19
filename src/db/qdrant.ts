import {QdrantClient} from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({url: process.env.QDRANT_URL ?? 'http://127.0.0.1:6333'});

const {collections} = await qdrantClient.getCollections();

const hasMemories = !!collections.find((collection) => collection.name === "memory");

const hasTags = !!collections.find((collection) => collection.name === "tag");

// instruction_doc's own collection (Milestone 1, Iteration 2) — kept separate
// from `memory` so resource types never cross-contaminate search results.
// Sized for nomic-embed-text-v1.5 (768 dims), the model Iteration 3 swaps
// embed() to. `memory`/`tag` stay at 384 dims until that swap lands — bumping
// their dimension ahead of the model that produces it would break the
// currently-working memory/tag tools for no benefit, since this collection
// isn't written to until Iteration 3's ingestion pipeline exists.
const hasInstructions = !!collections.find((collection) => collection.name === "instruction");

if (!hasMemories) {
    await qdrantClient.createCollection('memory', {
        vectors: {size: 384, distance: 'Cosine'},
    });
}

if (!hasTags) {
    await qdrantClient.createCollection('tag', {
        vectors: {size: 384, distance: 'Cosine'},
    });
}

if (!hasInstructions) {
    await qdrantClient.createCollection('instruction', {
        vectors: {size: 768, distance: 'Cosine'},
    });
}
