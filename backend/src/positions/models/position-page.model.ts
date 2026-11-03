import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '@/common/graphql/paginated.response';
import { Position } from '@/positions/models/position.model';

@ObjectType()
export class PositionPage extends Paginated(Position) {}
