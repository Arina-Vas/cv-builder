import { Transform, TransformFnParams } from 'class-transformer';

const normalizeText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const trimText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toUpperCase = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

export const NormalizeText = (): PropertyDecorator =>
  Transform(normalizeText, { toClassOnly: true });
export const TrimText = (): PropertyDecorator => Transform(trimText, { toClassOnly: true });
export const ToUpperCaseText = (): PropertyDecorator =>
  Transform(toUpperCase, { toClassOnly: true });
