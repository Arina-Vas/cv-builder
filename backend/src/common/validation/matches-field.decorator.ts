import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/** The value must equal another property of the same input, e.g. Confirm Password = Password. */
export function MatchesField<T extends object>(
  field: keyof T & string,
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'matchesField',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [field],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [other] = args.constraints as [string];
          return value === (args.object as Record<string, unknown>)[other];
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must match ${String(args.constraints[0])}`;
        },
      },
    });
  };
}
