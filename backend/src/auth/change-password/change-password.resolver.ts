import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentSessionId, CurrentUser } from '@/common/auth/current-user.decorator';
import { AuthThrottle } from '@/common/throttling/throttle.decorators';
import { User } from '@/users/models/user.model';
import { ChangePasswordService } from './change-password.service';
import { ChangePasswordInput } from './dto/change-password.input';

@Resolver()
export class ChangePasswordResolver {
  constructor(private readonly passwordChange: ChangePasswordService) {}

  @AuthThrottle()
  @Mutation(() => Boolean, {
    description:
      'Changes the password of the signed-in user. ' +
      'Fails with BAD_USER_INPUT (field "currentPassword") when the current password is incorrect. ' +
      'Signs out every other session of the user; the current session stays signed in.',
  })
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId: string,
  ): Promise<boolean> {
    await this.passwordChange.change(user.id, sessionId, input.currentPassword, input.newPassword);
    return true;
  }
}
