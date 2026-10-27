import { passwordResetMail, verificationCodeMail } from './mail.templates';

describe('mail templates', () => {
  it('escapes the reset link inside the HTML', () => {
    const { html } = passwordResetMail('http://x.test/?a=1&b="2"', 60);

    expect(html).toContain('href="http://x.test/?a=1&amp;b=&quot;2&quot;"');
  });

  it('puts the same code in the text and HTML versions', () => {
    const { text, html } = verificationCodeMail('000042', 10);

    expect(text).toContain('000042');
    expect(html).toContain('000042');
  });
});
