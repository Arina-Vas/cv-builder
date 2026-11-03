import { plainToInstance } from 'class-transformer';
import { IsDate, validateSync } from 'class-validator';
import { IsNotBeforeDate } from './is-not-before-date';

class PeriodDto {
  @IsDate()
  startDate!: unknown;

  @IsDate()
  @IsNotBeforeDate('startDate', { message: 'End date cannot be earlier than start date' })
  endDate!: unknown;
}

const date = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const validate = (plain: Partial<Record<keyof PeriodDto, unknown>>) =>
  validateSync(plainToInstance(PeriodDto, plain));

const errorsOf = (plain: Partial<Record<keyof PeriodDto, unknown>>): string[] =>
  validate(plain).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );

describe('IsNotBeforeDate', () => {
  it('accepts an end date after the start date', () => {
    expect(errorsOf({ startDate: date('2025-01-01'), endDate: date('2025-02-01') })).toEqual([]);
  });

  it('accepts an end date equal to the start date', () => {
    expect(errorsOf({ startDate: date('2025-01-01'), endDate: date('2025-01-01') })).toEqual([]);
  });

  it('rejects an end date before the start date', () => {
    expect(errorsOf({ startDate: date('2025-02-01'), endDate: date('2025-01-31') })).toEqual([
      'endDate.isNotBeforeDate',
    ]);
  });

  it('uses the message passed to the decorator', () => {
    const errors = validate({ startDate: date('2025-02-01'), endDate: date('2025-01-31') });

    expect(errors).toMatchObject([
      { constraints: { isNotBeforeDate: 'End date cannot be earlier than start date' } },
    ]);
  });

  it.each([undefined, null, 'not a date', new Date('invalid')])(
    'leaves a start date of %p to @IsDate',
    (startDate) => {
      expect(errorsOf({ startDate, endDate: date('2025-01-01') })).toEqual(['startDate.isDate']);
    },
  );

  it.each([undefined, null, 'not a date', new Date('invalid')])(
    'leaves an end date of %p to @IsDate',
    (endDate) => {
      expect(errorsOf({ startDate: date('2025-01-01'), endDate })).toEqual(['endDate.isDate']);
    },
  );
});
