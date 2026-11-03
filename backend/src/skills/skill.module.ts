import { Module } from '@nestjs/common';
import { SkillService } from '@/skills/skill.service';
import { SkillResolver } from '@/skills/skill.resolver';
import { UserSkillService } from '@/skills/user-skills/user-skill.service';
import { UserSkillResolver } from '@/skills/user-skills/user-skill.resolver';

@Module({
  providers: [SkillService, SkillResolver, UserSkillService, UserSkillResolver],
})
export class SkillModule {}
