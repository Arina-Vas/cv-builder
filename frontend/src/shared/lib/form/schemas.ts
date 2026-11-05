import { z } from 'zod';

export const requiredString = (message: string) => z.string().trim().min(1, { error: message });
export const optionalString = () => z.string().trim();
export const requiredIds = (message: string, min = 1) =>
  z.array(z.string()).min(min, { error: message });

export const requiredDate = (message: string) =>
  z
    .date()
    .nullable()
    .refine((date) => date !== null, { error: message })
    .transform((date) => date as Date);
