import { pipeline, Tensor } from '@huggingface/transformers';
import { ApiError } from '../error.js';

const generator = await pipeline(
  'feature-extraction',
  // nomic-ai/nomic-embed-text-v1.5, ndims=768. Replaces
  // sentence-transformers/all-MiniLM-L6-v2 (384-dim) — see Milestone 1,
  // Iteration 3: nomic-embed is trained for asymmetric retrieval
  // (short query vs. long document) via explicit `search_query: ` /
  // `search_document: ` prefixes, unlike plain sentence-similarity models.
  'nomic-ai/nomic-embed-text-v1.5',
);

const runEmbedding = async (text: string): Promise<number[]> => {
  const result: Tensor = await generator(text, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding: number[] | undefined = result.tolist()[0];

  if (!embedding) {
    throw new ApiError(500, 'An unexpected error occurred while embedding the text.');
  }

  return embedding;
};

// Query and document text are embedded with different prefixes — this is
// how nomic-embed-text-v1.5 was trained to distinguish "what am I looking
// for" from "what might match it." Never call runEmbedding directly outside
// this file; always go through one of these two.
export const embedQuery = (text: string): Promise<number[]> =>
  runEmbedding(`search_query: ${text}`);

export const embedDocument = (text: string): Promise<number[]> =>
  runEmbedding(`search_document: ${text}`);

const embedCheap = async (text: string, dim: number = 64) => {
  const vector = new Array(dim).fill(0);

  for (let i = 0; i < text.length; i++) {
    vector[i % dim] += text.charCodeAt(i);
  }

  return vector.map((v) => v / text.length);
};
