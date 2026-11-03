import { InputType, PickType } from '@nestjs/graphql';
import { SignInInput } from '@/auth/dto/credentials.input';

@InputType()
export class RequestPasswordResetInput extends PickType(SignInInput, ['email'] as const) {}
