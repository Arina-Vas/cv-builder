export interface MailContent {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const verificationCodeMail = (code: string, expiresInMinutes: number): MailContent => ({
  subject: 'Your CV Builder verification code',
  text: [
    `Your verification code is ${code}.`,
    `It expires in ${expiresInMinutes} minutes.`,
    'If you did not create a CV Builder account, ignore this email.',
  ].join('\n\n'),
  html: [
    '<p>Your verification code is:</p>',
    `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${escapeHtml(code)}</p>`,
    `<p>It expires in ${expiresInMinutes} minutes.</p>`,
    '<p>If you did not create a CV Builder account, ignore this email.</p>',
  ].join(''),
});

export const passwordResetMail = (link: string, expiresInMinutes: number): MailContent => ({
  subject: 'Reset your CV Builder password',
  text: [
    'To set a new password, open this link:',
    link,
    `The link expires in ${expiresInMinutes} minutes and can be used once.`,
    'If you did not ask to reset your password, ignore this email; your password stays the same.',
  ].join('\n\n'),
  html: [
    '<p>To set a new password, open this link:</p>',
    `<p><a href="${escapeHtml(link)}">Reset password</a></p>`,
    `<p>The link expires in ${expiresInMinutes} minutes and can be used once.</p>`,
    '<p>If you did not ask to reset your password, ignore this email; your password stays the same.</p>',
  ].join(''),
});
