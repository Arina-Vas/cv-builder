import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import type { Request } from 'express';
import type { GraphQLResolveInfo } from 'graphql';
import type { GqlContext } from '@/common/graphql/graphql.context';
import type { User } from '@/users/models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

const isGraphql = (context: ExecutionContext): boolean =>
  context.getType<GqlContextType>() === 'graphql';

export const getRequest = (context: ExecutionContext): AuthenticatedRequest =>
  isGraphql(context)
    ? GqlExecutionContext.create(context).getContext<GqlContext>().req
    : context.switchToHttp().getRequest<AuthenticatedRequest>();

export const isMutation = (context: ExecutionContext): boolean =>
  isGraphql(context) &&
  GqlExecutionContext.create(context).getInfo<GraphQLResolveInfo>().parentType.name === 'Mutation';
