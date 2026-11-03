import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LanguagePage } from '@/languages/models/language-page.model';
import { LanguageService } from '@/languages/language.service';
import { LanguagesArgs } from '@/languages/dto/languages.args';
import { Language } from '@/languages/models/language.model';
import { CreateLanguageInput } from '@/languages/dto/create-language.input';
import { UpdateLanguageInput } from '@/languages/dto/update-language.input';
import { ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '@/common/auth/roles.decorator';
import { UserRole } from '@/common/graphql/enums';

@Resolver(() => Language)
export class LanguageResolver {
  constructor(private readonly languageService: LanguageService) {}

  @Query(() => LanguagePage)
  languages(@Args() args: LanguagesArgs): Promise<LanguagePage> {
    return this.languageService.findAll(args);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Language)
  createLanguage(@Args('input') input: CreateLanguageInput): Promise<Language> {
    return this.languageService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Language)
  updateLanguage(@Args('input') input: UpdateLanguageInput): Promise<Language> {
    return this.languageService.update(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description: 'Fails with ENTITY_IN_USE if the language is assigned to users',
  })
  deleteLanguage(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<string> {
    return this.languageService.delete(id);
  }
}
