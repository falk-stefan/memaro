import { BadRequestError } from '../error.js';

export type UpdateValues<T extends object> = { id: string; values: T };

const removeUndefined = (obj: any) => {
  if (obj === null || typeof obj !== 'object') {
    return undefined;
  }
  if (Array.isArray(obj)) {
    return undefined;
  }
  for (const key in Object.keys(obj)) {
    if (typeof obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
};

export const removeUndefinedAndValidate = <T>(obj: T): Partial<T> => {
  const sanitized = removeUndefined(obj);

  if (!sanitized) {
    throw new BadRequestError('Invalid request body.');
  }

  if (Object.keys(sanitized).length === 0) {
    throw new BadRequestError('At least one field must be provided.');
  }
  return sanitized;
};
