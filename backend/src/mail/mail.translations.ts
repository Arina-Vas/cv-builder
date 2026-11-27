import type { Locale } from '@/common/i18n/locale';

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** The word "minutes" in the form the sentences below need (Slavic ones: accusative of duration). */
const MINUTE_FORMS: Record<Locale, PluralForms> = {
  en: { one: 'minute', other: 'minutes' },
  fr: { one: 'minute', other: 'minutes' },
  de: { one: 'Minute', other: 'Minuten' },
  it: { one: 'minuto', other: 'minuti' },
  pl: { one: 'minutę', few: 'minuty', many: 'minut', other: 'minuty' },
  pt: { one: 'minuto', other: 'minutos' },
  ru: { one: 'минуту', few: 'минуты', many: 'минут', other: 'минуты' },
  es: { one: 'minuto', other: 'minutos' },
  uk: { one: 'хвилину', few: 'хвилини', many: 'хвилин', other: 'хвилини' },
};

/** `10` → `10 минут` / `10 хвилин` / `10 minutes`, with the plural rules of the language. */
export const formatMinutes = (locale: Locale, minutes: number): string => {
  const forms = MINUTE_FORMS[locale];
  const rule = new Intl.PluralRules(locale).select(minutes);
  return `${minutes} ${forms[rule] ?? forms.other}`;
};

export interface MailStrings {
  verification: {
    subject: string;
    codeIntro: string;
    /** Gets the duration already formatted, e.g. "10 minutes". */
    expires: (duration: string) => string;
    ignore: string;
  };
  passwordReset: {
    subject: string;
    openLink: string;
    linkLabel: string;
    expires: (duration: string) => string;
    ignore: string;
  };
}

export const MAIL_STRINGS: Record<Locale, MailStrings> = {
  en: {
    verification: {
      subject: 'Your CV Builder verification code',
      codeIntro: 'Your verification code is:',
      expires: (d) => `It expires in ${d}.`,
      ignore: 'If you did not create a CV Builder account, ignore this email.',
    },
    passwordReset: {
      subject: 'Reset your CV Builder password',
      openLink: 'To set a new password, open this link:',
      linkLabel: 'Reset password',
      expires: (d) => `The link expires in ${d} and can be used once.`,
      ignore:
        'If you did not ask to reset your password, ignore this email; your password stays the same.',
    },
  },
  fr: {
    verification: {
      subject: 'Votre code de vérification CV Builder',
      codeIntro: 'Votre code de vérification est :',
      expires: (d) => `Il expire dans ${d}.`,
      ignore: "Si vous n'avez pas créé de compte CV Builder, ignorez cet e-mail.",
    },
    passwordReset: {
      subject: 'Réinitialisez votre mot de passe CV Builder',
      openLink: 'Pour définir un nouveau mot de passe, ouvrez ce lien :',
      linkLabel: 'Réinitialiser le mot de passe',
      expires: (d) => `Le lien expire dans ${d} et ne peut être utilisé qu'une seule fois.`,
      ignore:
        "Si vous n'avez pas demandé la réinitialisation de votre mot de passe, ignorez cet e-mail ; votre mot de passe reste inchangé.",
    },
  },
  de: {
    verification: {
      subject: 'Ihr CV Builder-Bestätigungscode',
      codeIntro: 'Ihr Bestätigungscode lautet:',
      expires: (d) => `Der Code ist ${d} lang gültig.`,
      ignore: 'Wenn Sie kein CV Builder-Konto erstellt haben, ignorieren Sie diese E-Mail.',
    },
    passwordReset: {
      subject: 'Setzen Sie Ihr CV Builder-Passwort zurück',
      openLink: 'Um ein neues Passwort festzulegen, öffnen Sie diesen Link:',
      linkLabel: 'Passwort zurücksetzen',
      expires: (d) => `Der Link ist ${d} lang gültig und kann nur einmal verwendet werden.`,
      ignore:
        'Wenn Sie das Zurücksetzen Ihres Passworts nicht angefordert haben, ignorieren Sie diese E-Mail; Ihr Passwort bleibt unverändert.',
    },
  },
  it: {
    verification: {
      subject: 'Il tuo codice di verifica CV Builder',
      codeIntro: 'Il tuo codice di verifica è:',
      expires: (d) => `Scade tra ${d}.`,
      ignore: 'Se non hai creato un account CV Builder, ignora questa email.',
    },
    passwordReset: {
      subject: 'Reimposta la tua password CV Builder',
      openLink: 'Per impostare una nuova password, apri questo link:',
      linkLabel: 'Reimposta password',
      expires: (d) => `Il link scade tra ${d} e può essere usato una sola volta.`,
      ignore:
        'Se non hai richiesto di reimpostare la password, ignora questa email; la tua password resta invariata.',
    },
  },
  pl: {
    verification: {
      subject: 'Twój kod weryfikacyjny CV Builder',
      codeIntro: 'Twój kod weryfikacyjny to:',
      expires: (d) => `Kod jest ważny przez ${d}.`,
      ignore: 'Jeśli to nie Ty zakładasz konto w CV Builder, zignoruj tę wiadomość.',
    },
    passwordReset: {
      subject: 'Zresetuj hasło do CV Builder',
      openLink: 'Aby ustawić nowe hasło, otwórz ten link:',
      linkLabel: 'Zresetuj hasło',
      expires: (d) => `Link jest ważny przez ${d} i można go użyć tylko raz.`,
      ignore:
        'Jeśli prośba o zresetowanie hasła nie pochodzi od Ciebie, zignoruj tę wiadomość; Twoje hasło pozostanie bez zmian.',
    },
  },
  pt: {
    verification: {
      subject: 'Seu código de verificação do CV Builder',
      codeIntro: 'Seu código de verificação é:',
      expires: (d) => `Ele expira em ${d}.`,
      ignore: 'Se você não criou uma conta no CV Builder, ignore este e-mail.',
    },
    passwordReset: {
      subject: 'Redefina sua senha do CV Builder',
      openLink: 'Para definir uma nova senha, abra este link:',
      linkLabel: 'Redefinir senha',
      expires: (d) => `O link expira em ${d} e só pode ser usado uma vez.`,
      ignore:
        'Se você não pediu para redefinir sua senha, ignore este e-mail; sua senha continua a mesma.',
    },
  },
  ru: {
    verification: {
      subject: 'Ваш код подтверждения CV Builder',
      codeIntro: 'Ваш код подтверждения:',
      expires: (d) => `Код действует ${d}.`,
      ignore: 'Если вы не создавали аккаунт в CV Builder, проигнорируйте это письмо.',
    },
    passwordReset: {
      subject: 'Сброс пароля CV Builder',
      openLink: 'Чтобы задать новый пароль, откройте эту ссылку:',
      linkLabel: 'Сбросить пароль',
      expires: (d) => `Ссылка действует ${d}, её можно использовать только один раз.`,
      ignore:
        'Если вы не запрашивали сброс пароля, проигнорируйте это письмо — ваш пароль не изменится.',
    },
  },
  es: {
    verification: {
      subject: 'Tu código de verificación de CV Builder',
      codeIntro: 'Tu código de verificación es:',
      expires: (d) => `Caduca en ${d}.`,
      ignore: 'Si no has creado una cuenta en CV Builder, ignora este correo.',
    },
    passwordReset: {
      subject: 'Restablece tu contraseña de CV Builder',
      openLink: 'Para establecer una nueva contraseña, abre este enlace:',
      linkLabel: 'Restablecer contraseña',
      expires: (d) => `El enlace caduca en ${d} y solo se puede usar una vez.`,
      ignore:
        'Si no has solicitado restablecer tu contraseña, ignora este correo; tu contraseña seguirá siendo la misma.',
    },
  },
  uk: {
    verification: {
      subject: 'Ваш код підтвердження CV Builder',
      codeIntro: 'Ваш код підтвердження:',
      expires: (d) => `Код дійсний ${d}.`,
      ignore: 'Якщо ви не створювали акаунт у CV Builder, проігноруйте цей лист.',
    },
    passwordReset: {
      subject: 'Скидання пароля CV Builder',
      openLink: 'Щоб задати новий пароль, відкрийте це посилання:',
      linkLabel: 'Скинути пароль',
      expires: (d) => `Посилання дійсне ${d}, його можна використати лише один раз.`,
      ignore:
        'Якщо ви не запитували скидання пароля, проігноруйте цей лист — ваш пароль не зміниться.',
    },
  },
};
