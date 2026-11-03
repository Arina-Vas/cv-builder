import { type ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';
import { rateLimited } from '@/common/errors/app-errors';
import type { GqlContext } from '@/common/graphql/graphql.context';

export const RATE_LIMIT_MESSAGE = 'Please wait before trying again';

/**
 * ThrottlerGuard reads req/res from the HTTP context, which is empty for GraphQL resolvers.
 * This guard takes them from the GraphQL context and reports the limit as RATE_LIMITED.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected override getRequestResponse(context: ExecutionContext): GqlContext {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return super.getRequestResponse(context) as GqlContext;
    }
    const { req, res } = GqlExecutionContext.create(context).getContext<GqlContext>();
    return { req, res };
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return super.throwThrottlingException(context, detail);
    }
    throw rateLimited(detail.timeToBlockExpire, RATE_LIMIT_MESSAGE);
  }
}
