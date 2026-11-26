/** Escapes LIKE wildcards so `%`, `_` and `\` in a search are matched literally. */
export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** Case-insensitive "contains" filter for list search. */
export const containsInsensitive = (search: string) => ({
  contains: escapeLike(search),
  mode: 'insensitive' as const,
});
