import { ValidateBy, type ValidationArguments, type ValidationOptions } from 'class-validator';

const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

const isNotBeforeDate = (value: unknown, { object, constraints }: ValidationArguments): boolean => {
  const start = (object as Record<string, unknown>)[constraints[0] as string];
  return !isValidDate(start) || !isValidDate(value) || start.getTime() <= value.getTime();
};

export const IsNotBeforeDate = (property: string, options?: ValidationOptions): PropertyDecorator =>
  ValidateBy(
    { name: 'isNotBeforeDate', constraints: [property], validator: { validate: isNotBeforeDate } },
    options,
  );
