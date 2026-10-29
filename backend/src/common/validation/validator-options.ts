import type { ValidatorOptions } from 'class-validator';

/**
 * One error per field: class-validator stops at the first failed check of a property.
 * Checks run bottom-up (the decorator closest to the property first), so put @IsNotEmpty at the
 * bottom (it also catches null/undefined), @IsString above it, then format and length checks.
 */
export const VALIDATOR_OPTIONS = { stopAtFirstError: true } as const satisfies ValidatorOptions;
