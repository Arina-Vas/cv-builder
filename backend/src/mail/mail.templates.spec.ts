import { LOCALES } from '@/common/i18n/locale';
import { passwordResetMail, verificationCodeMail } from './mail.templates';
import { formatMinutes, MAIL_STRINGS } from './mail.translations';

describe('mail templates', () => {
  it('escapes the reset link inside the HTML', () => {
    const { html } = passwordResetMail('http://x.test/?a=1&b="2"', 60, 'en');

    expect(html).toContain('href="http://x.test/?a=1&amp;b=&quot;2&quot;"');
  });

  it('puts the same code in the text and HTML versions', () => {
    const { text, html } = verificationCodeMail('000042', 10, 'en');

    expect(text).toContain('000042');
    expect(html).toContain('000042');
  });

  it('writes the verification email in the requested language', () => {
    const { subject, text, html } = verificationCodeMail('042917', 10, 'ru');

    expect(subject).toBe('Ваш код подтверждения CV Builder');
    expect(text).toContain('Ваш код подтверждения: 042917');
    expect(text).toContain('Код действует 10 минут.');
    expect(html).toContain('Код действует 10 минут.');
  });

  it('writes the password reset email in the requested language', () => {
    const link = 'http://localhost:3000/reset-password?token=abc';
    const { subject, text, html } = passwordResetMail(link, 30, 'uk');

    expect(subject).toBe('Скидання пароля CV Builder');
    expect(text).toContain(link);
    expect(text).toContain('Посилання дійсне 30 хвилин');
    expect(html).toContain(`<a href="${link}">Скинути пароль</a>`);
  });

  it.each(LOCALES)('has every string for %s and keeps the code and link', (locale) => {
    const verification = verificationCodeMail('123456', 10, locale);
    const reset = passwordResetMail('http://x.test/r', 30, locale);

    expect(MAIL_STRINGS[locale].verification.subject).not.toBe('');
    expect(verification.text).toContain('123456');
    expect(verification.text).toContain(formatMinutes(locale, 10));
    expect(reset.text).toContain('http://x.test/r');
    expect(reset.text).toContain(formatMinutes(locale, 30));
  });
});

describe('formatMinutes', () => {
  it.each([
    ['en', 1, '1 minute'],
    ['en', 10, '10 minutes'],
    ['ru', 1, '1 минуту'],
    ['ru', 3, '3 минуты'],
    ['ru', 10, '10 минут'],
    ['uk', 21, '21 хвилину'],
    ['uk', 24, '24 хвилини'],
    ['pl', 1, '1 minutę'],
    ['pl', 22, '22 minuty'],
    ['pl', 30, '30 minut'],
    ['de', 30, '30 Minuten'],
  ] as const)('%s, %d → %s', (locale, minutes, expected) => {
    expect(formatMinutes(locale, minutes)).toBe(expected);
  });
});
