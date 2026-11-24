import { Field, ID, InputType } from '@nestjs/graphql';
import { Locale } from '@/common/graphql/locale.enum';
import { IsEnum, IsUUID } from 'class-validator';

@InputType()
export class GenerateCvPdfInput {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  @Field(() => Locale)
  @IsEnum(Locale)
  locale: Locale = Locale.en;
}
