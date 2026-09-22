import { describe, expect, it } from 'vitest';
import { reorderByFusedRank } from './instruction.service.js';

// Milestone 1, Iteration 6 dogfooding caught a real bug here: `read_instructions`
// in `mode: 'short'` fetched docs via `Model.findAll({ where: { id: [...] } })`,
// which returns rows in table order, silently discarding the RRF fusion rank
// and making the "top result" arbitrary. This guards the fix.
describe('reorderByFusedRank', () => {
  it('sorts items back into the given id order, regardless of input order', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    expect(reorderByFusedRank(items, [3, 1, 2], (item) => item.id)).toEqual([
      { id: 3 },
      { id: 1 },
      { id: 2 },
    ]);
  });

  it('drops ids that have no matching item instead of throwing', () => {
    const items = [{ id: 1 }, { id: 2 }];

    expect(reorderByFusedRank(items, [2, 99, 1], (item) => item.id)).toEqual([
      { id: 2 },
      { id: 1 },
    ]);
  });
});
