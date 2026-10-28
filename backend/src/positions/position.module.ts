import { Module } from '@nestjs/common';
import { PositionService } from '@/positions/position.service';
import { PositionResolver } from '@/positions/position.resolver';

@Module({
  providers: [PositionService, PositionResolver],
})
export class PositionModule {}
