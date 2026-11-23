import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CvSkillService } from './cv-skill.service';
import { CvSkill } from './models/cv-skill.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { User } from '@/users/models/user.model';
import { ParseUUIDPipe } from '@nestjs/common';
import { Skill } from '@/skills/models/skill.model';
import { CreateCvSkillInput } from './dto/create-cv-skill.input';
import { DeleteCvSkillsArgs } from './dto/delete-cv-skills.args';

const ACCESS =
  'Own CV or Admin. Fails with NOT_FOUND if the CV does not exist ' +
  "and FORBIDDEN for another user's CV";

@Resolver(() => CvSkill)
export class CvSkillResolver {
  constructor(private readonly cvSkillService: CvSkillService) {}

  @Query(() => [CvSkill], {
    description:
      "Skills of one CV with the CV owner's mastery; sorted by category name, then skill name. " +
      ACCESS,
  })
  cvSkills(
    @CurrentUser() currentUser: User,
    @Args('cvId', { type: () => ID }, ParseUUIDPipe) cvId: string,
  ): Promise<CvSkill[]> {
    return this.cvSkillService.findByCv(currentUser, cvId);
  }

  @Query(() => [Skill], {
    description:
      'Skills of the CV owner not yet added to the CV, for the Add skill modal; sorted by name. ' +
      ACCESS,
  })
  availableCvSkills(
    @CurrentUser() currentUser: User,
    @Args('cvId', { type: () => ID }, ParseUUIDPipe) cvId: string,
  ): Promise<Skill[]> {
    return this.cvSkillService.findAvailable(currentUser, cvId);
  }

  @Mutation(() => CvSkill, {
    description:
      `Adds one of the CV owner's skills to the CV. ${ACCESS}. ` +
      'Fails with BAD_USER_INPUT (skillId) if the CV owner does not have the skill ' +
      'and with CONFLICT (skillId) if it is already in the CV',
  })
  createCvSkill(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateCvSkillInput,
  ): Promise<CvSkill> {
    return this.cvSkillService.create(currentUser, input);
  }

  @Mutation(() => [ID], {
    description:
      `Removes the given CvSkill ids from the CV and returns the removed ids; the catalog skill ` +
      `and the owner's skills stay. ${ACCESS}. Ids already removed are skipped. ` +
      'Fails with FORBIDDEN and removes nothing if an id belongs to another CV',
  })
  deleteCvSkills(
    @CurrentUser() currentUser: User,
    @Args() args: DeleteCvSkillsArgs,
  ): Promise<string[]> {
    return this.cvSkillService.delete(currentUser, args);
  }
}
