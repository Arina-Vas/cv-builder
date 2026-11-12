import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphQLUpload, type Upload } from 'graphql-upload-minimal';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';
import { CreateUserInput } from '@/users/dto/create-user.input';
import { UpdateProfileInput } from '@/users/dto/update-profile.input';
import { UpdateUserInput } from '@/users/dto/update-user.input';
import { UsersArgs } from '@/users/dto/users.args';
import { UserPage } from '@/users/models/user-page.model';
import { User } from '@/users/models/user.model';
import { UsersService } from '@/users/users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserPage)
  users(@Args() args: UsersArgs): Promise<UserPage> {
    return this.usersService.findAll(args);
  }

  @Query(() => User, { description: 'Fails with NOT_FOUND if the user does not exist' })
  user(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => User, {
    description:
      'Fails with CONFLICT (field: email) if the email is taken, BAD_USER_INPUT if the department or position does not exist',
  })
  createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.createUser(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => User, {
    description:
      'Fails with NOT_FOUND if the user does not exist, BAD_USER_INPUT if the department or position does not exist, OPERATION_NOT_ALLOWED when changing own role or demoting the last admin',
  })
  updateUser(@Args('input') input: UpdateUserInput, @CurrentUser() user: User): Promise<User> {
    return this.usersService.update(input, user.id);
  }

  @Mutation(() => User, {
    description:
      "Own profile or Admin; the role is not changed here. Fails with FORBIDDEN for another user's profile, " +
      'NOT_FOUND if the user does not exist, BAD_USER_INPUT if the department or position does not exist',
  })
  updateProfile(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<User> {
    return this.usersService.updateProfile(currentUser, input);
  }

  @Mutation(() => User, {
    description:
      'Own profile or Admin. PNG, JPEG or GIF up to 5 MB, checked by the file content. Fails with FORBIDDEN ' +
      "for another user's profile, NOT_FOUND if the user does not exist, BAD_USER_INPUT (field: file) for a " +
      'wrong type or size. Send as a multipart request with the `apollo-require-preflight` header',
  })
  uploadAvatar(
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Upload['promise'],
  ): Promise<User> {
    return this.usersService.uploadAvatar(currentUser, userId, file);
  }

  @Mutation(() => User, {
    description:
      "Own profile or Admin. Fails with FORBIDDEN for another user's profile, NOT_FOUND if the user does not exist",
  })
  removeAvatar(
    @CurrentUser() currentUser: User,
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<User> {
    return this.usersService.removeAvatar(currentUser, userId);
  }

  @ResolveField(() => String, { nullable: true, description: 'Public URL of the avatar image' })
  avatarUrl(@Parent() user: User): string | null {
    return this.usersService.getAvatarUrl(user);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description:
      'Fails with NOT_FOUND if the user does not exist, OPERATION_NOT_ALLOWED when deleting own account or the last admin',
  })
  deleteUser(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<string> {
    return this.usersService.delete(id, user.id);
  }
}
