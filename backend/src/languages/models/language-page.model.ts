import { ObjectType } from '@nestjs/graphql';
import { Language } from '@/languages/models/language.model';
import { Paginated } from '@/common/graphql/paginated.response';

@ObjectType()
export class LanguagePage extends Paginated(Language) {}
