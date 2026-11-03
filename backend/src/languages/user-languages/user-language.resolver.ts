import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { User } from '@/users/models/user.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { UserLanguage } from '@/languages/user-languages/models/user-language.model';
import { UserLanguageService } from '@/languages/user-languages/user-language.service';
import { Language } from '@/languages/models/language.model';
import { CreateUserLanguageInput } from '@/languages/user-languages/dto/create-user-language.input';
import { UpdateUserLanguageInput } from '@/languages/user-languages/dto/update-user-language.input';
import { DeleteUserLanguagesArgs } from '@/languages/user-languages/dto/delete-user-languages.args';

@Resolver(() => UserLanguage)
export class UserLanguageResolver {
  constructor(private readonly userLanguageService: UserLanguageService) {}

  @Query(() => [UserLanguage], {
    description:
      'Languages of the user, readable by any authenticated user; sorted by language name. ' +
      'Fails with NOT_FOUND if the user does not exist',
  })
  userLanguages(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<UserLanguage[]> {
    return this.userLanguageService.findByUser(userId);
  }

  @Query(() => [Language], {
    description:
      'Languages not yet assigned to the user, for the Add Language modal; sorted by name. ' +
      'Fails with NOT_FOUND if the user does not exist',
  })
  availableUserLanguages(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<Language[]> {
    return this.userLanguageService.findAvailable(userId);
  }

  @Mutation(() => UserLanguage, {
    description:
      'Own profile or Admin. Fails with BAD_USER_INPUT (languageId) if the language does not exist ' +
      'and with CONFLICT (languageId) if it is already assigned',
  })
  createUserLanguage(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateUserLanguageInput,
  ): Promise<UserLanguage> {
    return this.userLanguageService.create(currentUser, input);
  }

  @Mutation(() => UserLanguage, {
    description:
      'Own profile or Admin. Changes only the proficiency level; fails with NOT_FOUND ' +
      'if the assignment does not exist or belongs to another user',
  })
  updateUserLanguage(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateUserLanguageInput,
  ): Promise<UserLanguage> {
    return this.userLanguageService.update(currentUser, input);
  }

  @Mutation(() => [ID], {
    description:
      'Own profile or Admin. Removes the given UserLanguage ids of the user; returns the removed ids',
  })
  deleteUserLanguages(
    @CurrentUser() currentUser: User,
    @Args() args: DeleteUserLanguagesArgs,
  ): Promise<string[]> {
    return this.userLanguageService.delete(currentUser, args);
  }
}
