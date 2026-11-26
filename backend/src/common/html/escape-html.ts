/**
 * Escapes a value for HTML text and quoted attribute values, so user data (CV text, names)
 * cannot add markup to generated HTML: emails, the CV PDF.
 */
export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
