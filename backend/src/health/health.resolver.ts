import { Query, Resolver } from '@nestjs/graphql';
import { Public } from '@/common/auth/public.decorator';
import { Health } from './health.model';

@Resolver(() => Health)
export class HealthResolver {
  @Public()
  @Query(() => Health)
  health(): Health {
    return { status: 'ok' };
  }
}
