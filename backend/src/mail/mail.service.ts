import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { Locale } from '@/common/i18n/locale';
import type { EnvironmentVariables } from '@/config/env.validation';
import { type MailContent, passwordResetMail, verificationCodeMail } from './mail.templates';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.transporter = createTransport({
      host: config.get('SMTP_HOST', { infer: true }),
      port: config.get('SMTP_PORT', { infer: true }),
    });
    this.from = config.get('MAIL_FROM', { infer: true });
  }

  sendVerificationCode(
    to: string,
    code: string,
    expiresInMinutes: number,
    locale: Locale,
  ): Promise<void> {
    return this.send(to, verificationCodeMail(code, expiresInMinutes, locale));
  }

  sendPasswordReset(
    to: string,
    link: string,
    expiresInMinutes: number,
    locale: Locale,
  ): Promise<void> {
    return this.send(to, passwordResetMail(link, expiresInMinutes, locale));
  }

  private async send(to: string, content: MailContent): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, ...content });
  }
}
