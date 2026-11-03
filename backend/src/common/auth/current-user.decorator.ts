import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { unauthenticated } from '@/common/errors/app-errors';
import type { User } from '@/users/models/user.model';
import { getRequest } from './request';

export const currentUser = (context: ExecutionContext): User => {
  const { user } = getRequest(context);
  if (!user) {
    throw unauthenticated();
  }
  return user;
};

export const currentSessionId = (context: ExecutionContext): string => {
  const { sessionId } = getRequest(context);
  if (!sessionId) {
    throw unauthenticated();
  }
  return sessionId;
};

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) =>
  currentUser(context),
);

export const CurrentSessionId = createParamDecorator((_: unknown, context: ExecutionContext) =>
  currentSessionId(context),
);
