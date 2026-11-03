import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { NormalizeText, ToUpperCaseText } from '@/common/validation/transforms';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { MAX_ISO_LENGTH } from '@/languages/language.constants';

@InputType()
export class CreateLanguageInput {
  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  name!: string;

  @Field()
  @IsString()
  @NormalizeText()
  @ToUpperCaseText()
  @IsNotEmpty({ message: 'ISO is required' })
  @MaxLength(MAX_ISO_LENGTH, {
    message: `ISO must not exceed ${MAX_ISO_LENGTH} characters`,
  })
  @Matches(/^[A-Z]{2,3}(-[A-Z]{2})?$/, { message: 'ISO must be a language code, e.g. EN or PT-BR' })
  iso!: string;

  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Native name is required' })
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Native name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  nativeName!: string;
}
