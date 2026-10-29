import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Skill } from '@/skills/models/skill.model';
import { SkillService } from '@/skills/skill.service';
import { SkillPage } from '@/skills/models/skill-page.model';
import { SkillsArgs } from '@/skills/dto/skills.args';
import { CreateSkillInput } from '@/skills/dto/create-skill.input';
import { UserRole } from '@/common/graphql/enums';
import { Roles } from '@/common/auth/roles.decorator';
import { UpdateSkillInput } from '@/skills/dto/update-skill.input';
import { ParseUUIDPipe } from '@nestjs/common';
import { SkillCategory } from '@/skills/models/skill-category.model';

@Resolver(() => Skill)
export class SkillResolver {
  constructor(private readonly skillService: SkillService) {}

  @Query(() => SkillPage)
  skills(@Args() args: SkillsArgs): Promise<SkillPage> {
    return this.skillService.findAll(args);
  }

  @Query(() => [SkillCategory])
  skillCategories(): Promise<SkillCategory[]> {
    return this.skillService.findCategories();
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Skill)
  createSkill(@Args('input') input: CreateSkillInput): Promise<Skill> {
    return this.skillService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Skill)
  updateSkill(@Args('input') input: UpdateSkillInput): Promise<Skill> {
    return this.skillService.update(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description: 'Fails with ENTITY_IN_USE if the skill is assigned to users, projects or CVs',
  })
  deleteSkill(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<string> {
    return this.skillService.delete(id);
  }
}
