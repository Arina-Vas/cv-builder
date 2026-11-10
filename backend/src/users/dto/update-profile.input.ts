import { InputType, PickType } from '@nestjs/graphql';
import { UpdateUserInput } from '@/users/dto/update-user.input';

// Profile tab: the same fields and validation as updateUser, but without the role —
// an Employee edits their own profile here and must not be able to change their role
@InputType()
export class UpdateProfileInput extends PickType(UpdateUserInput, [
  'id',
  'firstName',
  'lastName',
  'departmentId',
  'positionId',
] as const) {}
