import { NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';
import { CreateUserInput } from '@/users/dto/create-user.input';
import { UpdateUserInput } from '@/users/dto/update-user.input';
import { UsersArgs } from '@/users/dto/users.args';
import { UserPage } from '@/users/models/user-page.model';
import { User } from '@/users/models/user.model';

// KAN-44: inject UsersService and replace the NotImplementedException bodies with service calls
@Resolver(() => User)
export class UsersResolver {
  @Query(() => UserPage)
  users(@Args() _args: UsersArgs): Promise<UserPage> {
    // KAN-44: return this.usersService.findAll(args);
    throw new NotImplementedException();
  }

  @Query(() => User, { description: 'Fails with NOT_FOUND if the user does not exist' })
  user(@Args('id', { type: () => ID }, ParseUUIDPipe) _id: string): Promise<User> {
    // KAN-44: return this.usersService.findOne(id);
    throw new NotImplementedException();
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => User, {
    description:
      'Fails with CONFLICT (field: email) if the email is taken, BAD_USER_INPUT if the department or position does not exist',
  })
  createUser(@Args('input') _input: CreateUserInput): Promise<User> {
    // KAN-44: return this.usersService.create(input);
    throw new NotImplementedException();
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => User, {
    description:
      'Fails with NOT_FOUND if the user does not exist, BAD_USER_INPUT if the department or position does not exist, OPERATION_NOT_ALLOWED when changing own role or demoting the last admin',
  })
  updateUser(@Args('input') _input: UpdateUserInput): Promise<User> {
    // KAN-44: return this.usersService.update(input);
    throw new NotImplementedException();
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description:
      'Fails with NOT_FOUND if the user does not exist, OPERATION_NOT_ALLOWED when deleting own account or the last admin',
  })
  deleteUser(@Args('id', { type: () => ID }, ParseUUIDPipe) _id: string): Promise<string> {
    // KAN-44: return this.usersService.delete(id);
    throw new NotImplementedException();
  }
}
