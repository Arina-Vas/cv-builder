import { Query, Resolver } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@/common/auth/public.decorator';
import { Health } from './health.model';

@Resolver(() => Health)
export class HealthResolver {
  @Public()
  @SkipThrottle()
  @Query(() => Health)
  health(): Health {
    return { status: 'ok' };
  }
}
