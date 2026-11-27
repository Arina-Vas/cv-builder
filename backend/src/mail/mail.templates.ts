import { escapeHtml } from '@/common/html/escape-html';
import type { Locale } from '@/common/i18n/locale';
import { formatMinutes, MAIL_STRINGS } from './mail.translations';

export interface MailContent {
  subject: string;
  text: string;
  html: string;
}

export const verificationCodeMail = (
  code: string,
  expiresInMinutes: number,
  locale: Locale,
): MailContent => {
  const t = MAIL_STRINGS[locale].verification;
  const expires = t.expires(formatMinutes(locale, expiresInMinutes));

  return {
    subject: t.subject,
    text: [`${t.codeIntro} ${code}`, expires, t.ignore].join('\n\n'),
    html: [
      `<p>${escapeHtml(t.codeIntro)}</p>`,
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${escapeHtml(code)}</p>`,
      `<p>${escapeHtml(expires)}</p>`,
      `<p>${escapeHtml(t.ignore)}</p>`,
    ].join(''),
  };
};

export const passwordResetMail = (
  link: string,
  expiresInMinutes: number,
  locale: Locale,
): MailContent => {
  const t = MAIL_STRINGS[locale].passwordReset;
  const expires = t.expires(formatMinutes(locale, expiresInMinutes));

  return {
    subject: t.subject,
    text: [t.openLink, link, expires, t.ignore].join('\n\n'),
    html: [
      `<p>${escapeHtml(t.openLink)}</p>`,
      `<p><a href="${escapeHtml(link)}">${escapeHtml(t.linkLabel)}</a></p>`,
      `<p>${escapeHtml(expires)}</p>`,
      `<p>${escapeHtml(t.ignore)}</p>`,
    ].join(''),
  };
};
