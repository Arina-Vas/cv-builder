import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import type { Request } from 'express';
import type { GraphQLResolveInfo } from 'graphql';
import type { GqlContext } from '@/common/graphql/graphql.context';
import type { User } from '@/users/models/user.model';

export interface Authentication {
  user: User;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
  /**
   * Authentication shared by the root fields of one query: GraphQL runs them in parallel,
   * so without it every field would load the session and the user again.
   * Lives only as long as this HTTP request. Mutations do not use it: they run one by one
   * and must see the session and role as changed by the previous field (e.g. `logout`).
   * Revisit if WebSocket subscriptions are added: their request lives for the whole connection.
   */
  authentication?: Promise<Authentication | null>;
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
