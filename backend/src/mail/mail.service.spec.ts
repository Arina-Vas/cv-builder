import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { EnvironmentVariables } from '@/config/env.validation';
import { MailService } from './mail.service';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const env: Record<string, unknown> = {
  SMTP_HOST: 'localhost',
  SMTP_PORT: 1025,
  MAIL_FROM: 'CV Builder <no-reply@cv-builder.local>',
};

describe('MailService', () => {
  const sendMail = jest.fn();
  const config = { get: jest.fn((key: string) => env[key]) };
  let service: MailService;

  beforeEach(() => {
    jest.mocked(createTransport).mockReturnValue({ sendMail } as never);
    service = new MailService(config as unknown as ConfigService<EnvironmentVariables, true>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('connects to the SMTP server from the config', () => {
    expect(createTransport).toHaveBeenCalledWith({ host: 'localhost', port: 1025 });
  });

  it('sends the verification code with its expiry', async () => {
    await service.sendVerificationCode('employee@cv-builder.local', '042917', 10);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: env['MAIL_FROM'],
        to: 'employee@cv-builder.local',
        subject: 'Your CV Builder verification code',
      }),
    );
    const { text, html } = sendMail.mock.calls[0][0] as { text: string; html: string };
    expect(text).toContain('042917');
    expect(text).toContain('10 minutes');
    expect(html).toContain('042917');
  });

  it('sends the password reset link with its expiry', async () => {
    const link = 'http://localhost:3000/reset-password?token=abc_123';

    await service.sendPasswordReset('employee@cv-builder.local', link, 60);

    const { subject, text, html } = sendMail.mock.calls[0][0] as {
      subject: string;
      text: string;
      html: string;
    };
    expect(subject).toBe('Reset your CV Builder password');
    expect(text).toContain(link);
    expect(text).toContain('60 minutes');
    expect(html).toContain(`href="${link}"`);
  });

  it('lets a failed delivery reach the caller', async () => {
    sendMail.mockRejectedValue(new Error('SMTP is down'));

    await expect(service.sendVerificationCode('a@b.co', '123456', 10)).rejects.toThrow(
      'SMTP is down',
    );
  });
});
