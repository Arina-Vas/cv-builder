import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Position } from '@/positions/models/position.model';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';
import { PositionService } from '@/positions/position.service';
import { PositionPage } from '@/positions/models/position-page.model';
import { PositionsArgs } from '@/positions/dto/positions.args';
import { CreatePositionInput } from '@/positions/dto/create-position.input';
import { UpdatePositionInput } from '@/positions/dto/update-position.input';
import { ParseUUIDPipe } from '@nestjs/common';

@Resolver(() => Position)
export class PositionResolver {
  constructor(private readonly positionService: PositionService) {}

  @Query(() => PositionPage)
  positions(@Args() args: PositionsArgs): Promise<PositionPage> {
    return this.positionService.findAll(args);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Position)
  createPosition(@Args('input') input: CreatePositionInput): Promise<Position> {
    return this.positionService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Position)
  updatePosition(@Args('input') input: UpdatePositionInput): Promise<Position> {
    return this.positionService.update(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description: 'Fails with ENTITY_IN_USE if the position is assigned to users',
  })
  deletePosition(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<string> {
    return this.positionService.delete(id);
  }
}
