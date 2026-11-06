import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type UseFormProps } from 'react-hook-form';
import type { z } from 'zod';

type UseAppFormProps<TInput extends FieldValues, TOutput extends FieldValues> = Omit<
  UseFormProps<TInput, unknown, TOutput>,
  'resolver'
> & { schema: z.ZodType<TOutput, TInput> };

export const useAppForm = <TInput extends FieldValues, TOutput extends FieldValues>({
  schema,
  ...props
}: UseAppFormProps<TInput, TOutput>) =>
  useForm<TInput, unknown, TOutput>({
    ...props,
    mode: props.mode ?? 'onTouched',
    reValidateMode: props.reValidateMode ?? 'onChange',
    resolver: zodResolver(schema),
  });
