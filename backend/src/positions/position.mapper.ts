import type { Position as PositionEntity } from '@/generated/prisma/client';
import type { Position } from '@/positions/models/position.model';

export const toPosition = (row: PositionEntity): Position => ({
  id: row.id,
  name: row.name,
});
