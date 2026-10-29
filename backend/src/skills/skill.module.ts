import { Module } from '@nestjs/common';
import { SkillService } from '@/skills/skill.service';
import { SkillResolver } from '@/skills/skill.resolver';

@Module({
  providers: [SkillService, SkillResolver],
})
export class SkillModule {}
