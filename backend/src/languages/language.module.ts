import { Module } from '@nestjs/common';
import { LanguageService } from '@/languages/language.service';
import { LanguageResolver } from '@/languages/language.resolver';

@Module({
  providers: [LanguageService, LanguageResolver],
})
export class LanguageModule {}
