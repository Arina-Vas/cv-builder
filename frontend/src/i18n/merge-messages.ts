type Messages = { [key: string]: string | Messages };

const isGroup = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Deep-merges a translation over the fallback messages: keys missing in `translation` keep the fallback text. */
export function mergeMessages<T extends Messages>(fallback: T, translation: Messages): T {
  const result: Messages = { ...fallback };
  for (const [key, value] of Object.entries(translation)) {
    const base = result[key];
    result[key] = isGroup(base) && isGroup(value) ? mergeMessages(base, value) : value;
  }
  return result as T;
}
