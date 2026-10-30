import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '@/common/graphql/paginated.response';
import { Skill } from '@/skills/models/skill.model';

@ObjectType()
export class SkillPage extends Paginated(Skill) {}
