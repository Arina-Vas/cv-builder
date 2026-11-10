import { Paginated } from '@/common/graphql/paginated.response';
import { ObjectType } from '@nestjs/graphql';
import { User } from '@/users/models/user.model';

@ObjectType()
export class UserPage extends Paginated(User) {}
