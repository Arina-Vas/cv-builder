import { Module } from '@nestjs/common';
import { LanguageService } from '@/languages/language.service';
import { LanguageResolver } from '@/languages/language.resolver';
import { UserLanguageService } from '@/languages/user-languages/user-language.service';
import { UserLanguageResolver } from '@/languages/user-languages/user-language.resolver';

@Module({
  providers: [LanguageService, LanguageResolver, UserLanguageService, UserLanguageResolver],
})
export class LanguageModule {}
