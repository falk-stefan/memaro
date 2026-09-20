// Response size budget from Milestone 1, Iteration 1 — a per-chunk cap that
// keeps each chunk about one coherent idea, and a total response cap that
// bounds what read_instructions can return regardless of how many chunks
// match. Approximated as ~4 characters/token since no tokenizer is wired in.
export const CHUNK_TOKEN_CAP = 500;
export const CHUNK_CHAR_CAP = CHUNK_TOKEN_CAP * 4;

export const TOTAL_RESPONSE_TOKEN_CAP = 2000;
