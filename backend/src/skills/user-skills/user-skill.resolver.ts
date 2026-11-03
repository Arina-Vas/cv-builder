import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { UserSkill } from '@/skills/user-skills/models/user-skill.model';
import { UserSkillService } from '@/skills/user-skills/user-skill.service';
import { Skill } from '@/skills/models/skill.model';
import { CreateUserSkillInput } from '@/skills/user-skills/dto/create-user-skill.input';
import { UpdateUserSkillInput } from '@/skills/user-skills/dto/update-user-skill.input';
import { DeleteUserSkillsArgs } from '@/skills/user-skills/dto/delete-user-skills.args';
import { User } from '@/users/models/user.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';

@Resolver(() => UserSkill)
export class UserSkillResolver {
  constructor(private readonly userSkillService: UserSkillService) {}

  @Query(() => [UserSkill])
  userSkills(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<UserSkill[]> {
    return this.userSkillService.findByUser(userId);
  }

  @Query(() => [Skill])
  availableUserSkills(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<Skill[]> {
    return this.userSkillService.findAvailable(userId);
  }

  @Mutation(() => UserSkill)
  createUserSkill(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateUserSkillInput,
  ): Promise<UserSkill> {
    return this.userSkillService.create(currentUser, input);
  }

  @Mutation(() => UserSkill)
  updateUserSkill(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateUserSkillInput,
  ): Promise<UserSkill> {
    return this.userSkillService.update(currentUser, input);
  }

  @Mutation(() => [ID], {
    description:
      'Own profile or Admin. Removes the given UserSkill ids of the user; returns the removed ids',
  })
  deleteUserSkills(
    @CurrentUser() currentUser: User,
    @Args() args: DeleteUserSkillsArgs,
  ): Promise<string[]> {
    return this.userSkillService.delete(currentUser, args);
  }
}
