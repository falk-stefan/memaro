import {QdrantClient} from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({url: 'http://127.0.0.1:6333'});

const {collections} = await qdrantClient.getCollections();

const hasMemories = !!collections.find((collection) => collection.name === "memory");

const hasTags = !!collections.find((collection) => collection.name === "tag");

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
