import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes markup characters and both quotes', () => {
    expect(escapeHtml(`<a href="x" title='y'>Tom & Jerry</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;',
    );
  });

  it('escapes the ampersand first, so entities are not escaped twice', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves plain text, cyrillic and new lines as they are', () => {
    expect(escapeHtml('Иван Петров\nReact, NestJS')).toBe('Иван Петров\nReact, NestJS');
  });
});
