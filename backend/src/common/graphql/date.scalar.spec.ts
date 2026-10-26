import { DateScalar } from './date.scalar';

describe('DateScalar', () => {
  it('serializes a Date to YYYY-MM-DD', () => {
    expect(DateScalar.serialize(new Date('2025-12-31T00:00:00.000Z'))).toBe('2025-12-31');
  });

  it('parses YYYY-MM-DD to a Date at UTC midnight', () => {
    expect(DateScalar.parseValue('2025-12-31')).toEqual(new Date('2025-12-31T00:00:00.000Z'));
  });

  it.each(['2025-02-30', '31.12.2025', '2025-12-31T10:00:00Z', '', 20251231])(
    'rejects %p',
    (value) => {
      expect(() => DateScalar.parseValue(value)).toThrow();
    },
  );
});
