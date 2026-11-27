import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/common/auth/request';
import { type Locale, negotiateLocale } from './locale';

export const requestLocale = (context: ExecutionContext): Locale =>
  negotiateLocale(getRequest(context).headers['accept-language']);

/** The language of the current request (from `Accept-Language`), for emails sent by the mutation. */
export const RequestLocale = createParamDecorator((_: unknown, context: ExecutionContext) =>
  requestLocale(context),
);
