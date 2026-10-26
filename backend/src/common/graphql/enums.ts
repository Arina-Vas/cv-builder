import { registerEnumType } from '@nestjs/graphql';
import { Mastery, Proficiency, UserRole } from '@/generated/prisma/enums';

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(Mastery, { name: 'Mastery' });
registerEnumType(Proficiency, { name: 'Proficiency' });

export { Mastery, Proficiency, UserRole };
