import {z} from "zod";
import {CreateTagSchema, GetTagsSchema} from "../tools/tools.schema.js";


export type CreateTag = z.infer<typeof CreateTagSchema>

export type TagQuery = z.infer<typeof GetTagsSchema>

export type Tag = {
  id: string;
  name: string;
  description: string;
}