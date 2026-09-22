/**
 * Minimal glob matcher for `.memaro` path-based tag rules — supports the two
 * patterns that config actually needs: `**` (any number of path segments,
 * including zero) and `*` (any characters within one segment). Not a
 * general-purpose glob library; add one only if a real rule needs more.
 */
export const matchesGlob = (pattern: string, relPath: string): boolean => {
  const tokens = pattern.split(/(\*\*\/|\*\*|\*)/).filter((t) => t !== '');

  const regexSource = tokens
    .map((token) => {
      if (token === '**/') {
        return '(?:.*/)?';
      }
      if (token === '**') {
        return '.*';
      }
      if (token === '*') {
        return '[^/]*';
      }
      return token.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    })
    .join('');

  return new RegExp(`^${regexSource}$`).test(relPath);
};
