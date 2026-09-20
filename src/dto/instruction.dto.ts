import { z } from 'zod';
import { ReadInstructionsSchema } from '../tools/tools.schema.js';

export type ReadInstructionsQuery = z.infer<typeof ReadInstructionsSchema>;

export type InstructionChunkResult = {
  docId: number;
  title: string;
  headingPath: string[];
  text: string;
  sourceUrl: string;
};

export type InstructionDocSummary = {
  docId: number;
  title: string;
  contextTags: string[];
  owner: string | null;
  scope: string;
  sourceUrl: string;
};

export type ReadInstructionsResult =
  | { found: false; message: string }
  | { found: true; chunks: InstructionChunkResult[] }
  | { found: true; docs: InstructionDocSummary[] };
