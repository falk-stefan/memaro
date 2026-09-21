import { z } from 'zod';
import { GetInstructionSchema, ReadInstructionsSchema } from '../tools/tools.schema.js';

export type ReadInstructionsQuery = z.infer<typeof ReadInstructionsSchema>;
export type GetInstructionQuery = z.infer<typeof GetInstructionSchema>;

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

export type InstructionDocFull = InstructionDocSummary & {
  body: string;
  lastReviewed: string | null;
};

export type ReadInstructionsResult =
  | { found: false; message: string }
  | { found: true; chunks: InstructionChunkResult[] }
  | {
      found: true;
      docs: InstructionDocSummary[];
      // Set only when `full` mode couldn't fit every match within the
      // response budget and fell back to a complete short-form list
      // instead of a silently partial one — see InstructionService.
      truncated?: true;
      message?: string;
    };
