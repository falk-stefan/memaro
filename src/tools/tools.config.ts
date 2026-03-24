import * as fs from "node:fs";
import {parse} from "yaml";
import {MemaroConfigSchema} from "../config.schema.js";
import {z} from "zod";


let cached: z.infer<typeof MemaroConfigSchema>;

export const loadMemaroConfig = async () => {

  if (cached) {
    return cached;
  }

  const memaroConfig = process.env.MEMARO_CONFIG ?? "./config.yaml";
  const file = fs.readFileSync(memaroConfig!, 'utf8');
  const rawConfig = parse(file);
  const {data: config, error} = MemaroConfigSchema.safeParse(rawConfig);

  if (!config) {
    throw error;
  }
  cached = Object.freeze(config);
  return cached;
};
