import { describe, expect, it } from 'vitest';
import { generateApiKey, hashApiKey, parseBearerToken } from './auth.js';

describe('parseBearerToken', () => {
  it('extracts the token from a well-formed Bearer header', () => {
    expect(parseBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('rejects a missing header', () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  it('rejects a non-Bearer scheme', () => {
    expect(parseBearerToken('Basic abc123')).toBeNull();
  });

  it('rejects a Bearer header with no token', () => {
    expect(parseBearerToken('Bearer')).toBeNull();
  });
});

describe('generateApiKey', () => {
  it('produces a hash that resolveApiKey can independently reproduce from the raw key', () => {
    const { rawKey, keyHash } = generateApiKey();

    expect(hashApiKey(rawKey)).toBe(keyHash);
  });

  it('never generates the same raw key twice', () => {
    const first = generateApiKey();
    const second = generateApiKey();

    expect(first.rawKey).not.toBe(second.rawKey);
  });
});
