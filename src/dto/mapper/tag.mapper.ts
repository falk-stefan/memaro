import { TagEntity } from '../../db/table/tag.entity.js';
import { Tag } from '../tag.dto.js';

export const toTag = (tagEntity: TagEntity): Tag => {
  return {
    id: tagEntity.dataValues.id,
    name: tagEntity.dataValues.name,
    description: tagEntity.dataValues.description,
  };
};
