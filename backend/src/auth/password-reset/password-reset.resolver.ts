import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from '@/common/auth/public.decorator';
import { RequestPasswordResetInput } from './dto/request-password-reset.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { PasswordResetService } from './password-reset.service';

@Resolver()
export class PasswordResetResolver {
  constructor(private readonly passwordReset: PasswordResetService) {}

  @Public()
  @Mutation(() => Boolean, {
    description: 'Always returns true, whether or not the email belongs to an account',
  })
  async requestPasswordReset(@Args('input') input: RequestPasswordResetInput): Promise<boolean> {
    await this.passwordReset.request(input.email);
    return true;
  }

  @Public()
  @Mutation(() => Boolean, {
    description:
      'Fails with BAD_USER_INPUT (field "token") when the link is invalid, used or expired. ' +
      'Signs out every session of the user; the client signs in again with the new password.',
  })
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<boolean> {
    await this.passwordReset.reset(input.token, input.newPassword);
    return true;
  }
}
