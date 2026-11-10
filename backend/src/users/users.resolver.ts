import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';
import { CreateUserInput } from '@/users/dto/create-user.input';
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
