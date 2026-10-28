import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AllowUnverified } from '@/common/auth/allow-unverified.decorator';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { User } from '@/users/models/user.model';
import { VerifyEmailInput } from './dto/verify-email.input';
import { EmailVerificationService } from './email-verification.service';

@Resolver()
export class EmailVerificationResolver {
  constructor(private readonly verification: EmailVerificationService) {}

  @AllowUnverified()
  @Mutation(() => User)
  verifyEmail(@Args('input') input: VerifyEmailInput, @CurrentUser() user: User): Promise<User> {
    return this.verification.verify(user, input.code);
  }

  @AllowUnverified()
  @Mutation(() => Boolean)
  async resendVerificationCode(@CurrentUser() user: User): Promise<boolean> {
    await this.verification.resend(user);
    return true;
  }
}
