import { MemoryRelationEntity } from '../table/memory-relation.entity.js';
import { MemoryEntity } from '../table/memory.entity.js';

export const MemoriesView = ({ ids }: { ids: (number | string)[] }) => ({
  attributes: ['id', 'text', 'type'],
  include: [
    {
      model: MemoryRelationEntity,
      attributes: ['sourceId', 'targetId', 'type'],
      include: [
        {
          model: MemoryEntity,
          attributes: ['id', 'text', 'type'],
          as: 'target',
        },
      ],
      limit: 10,
    },
  ],
  where: { id: ids },
});
