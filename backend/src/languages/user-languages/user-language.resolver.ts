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

  @Query(() => [UserLanguage])
  userLanguages(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<UserLanguage[]> {
    return this.userLanguageService.findByUser(userId);
  }

  @Query(() => [Language])
  availableUserLanguages(
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<Language[]> {
    return this.userLanguageService.findAvailable(userId);
  }

  @Mutation(() => UserLanguage)
  createUserLanguage(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateUserLanguageInput,
  ): Promise<UserLanguage> {
    return this.userLanguageService.create(currentUser, input);
  }

  @Mutation(() => UserLanguage)
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
