# Authentication

How sign-in, sessions and email verification work in the CV Builder backend, and the decisions behind them.
Requirements come from the CV Builder Wiki (Notion): Sign In, Sign Up, Forgot Password, Reset Password and
Email Verification pages. Tables are described in [data-model.md](data-model.md): `users`, `sessions`,
`auth_tokens`.

## Tokens and cookies

- **Both tokens live in httpOnly cookies** (access + refresh), never in `localStorage` or in GraphQL responses,
  so page scripts cannot read them.
- Cookie names: `access_token`, `refresh_token`; `path=/`, `maxAge` equals the token lifetime.
- Cookies use `SameSite=Lax`, `Secure` in production only. CORS allows the frontend origin (`FRONTEND_URL`)
  with credentials. The frontend and the API run on different ports of the same host, which is still one site,
  so `Lax` cookies are sent.
- The frontend route guard (`frontend/src/proxy.ts`, Next.js 16 Proxy, formerly Middleware) checks whether the
  refresh cookie exists to redirect between auth pages and the app. It is an optimistic check: the API still
  validates the session on every request.

| Token   | Format                                                      | Lifetime                              | Stored in the DB                 |
| ------- | ----------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| Access  | JWT signed with `JWT_ACCESS_SECRET`, `{ sub: userId, sid }` | 30 minutes (`JWT_ACCESS_TTL_SECONDS`) | no                               |
| Refresh | random value                                                | 1 day, sliding (`REFRESH_TTL_DAYS`)   | hash only, `sessions.token_hash` |

- Role and verification status are not stored in the access token.
- Every refresh **rotates** the refresh token (new value, new expiry), so an old refresh token stops working.
  Rotation is a conditional update on the old hash, so two parallel refreshes with the same token cannot both
  succeed.
- **Parallel refresh (two tabs share the cookies).** The session also keeps the hash of the replaced token
  (`previous_token_hash`, `rotated_at`). If a refresh comes with that token within 30 seconds of the rotation
  (`REFRESH_GRACE_SECONDS`), another request has just rotated it and the browser already has the new cookies:
  `refresh` returns `true` and leaves the cookies alone. It issues nothing new, so a stolen old token gains nothing.
- **Refresh token reuse.** The replaced token coming back **after** the 30 seconds cannot be a parallel tab: the
  browser has had the new token for a while, so someone else holds a copy. The server cannot tell which side is
  the thief, so it revokes the **whole session**: the request gets `UNAUTHENTICATED`, and whoever holds the current
  tokens is signed out too (the auth guard checks the session on every request, so the access token stops working
  at once). The real user signs in again with the password; the thief has none. The reuse is logged with the
  session and user ids only.
  - Only the **last** replaced token is kept. A token two or more rotations old is no longer in the database and is
    just rejected without revoking anything. Catching those too would need a history table of every token of the
    session; we accepted this limit, since the common case (one stolen token used once) is covered.
- An active user stays signed in; a user who is inactive for more than a day signs in again.

## Sessions and the auth guard

- One `sessions` row per sign-in; several devices at once are allowed.
- The auth guard checks the JWT, then loads the user and the session from the database on every request. A role
  change, a revoked session or a deleted user takes effect immediately, not when the access token expires.
- Logout revokes the current session and clears both cookies.
- Password reset revokes all sessions of the user.
- Changing the password in Settings revokes every other session of the user; the current one stays signed in.
- Reusing a replaced refresh token after the grace period revokes the session (see above).

### Cleanup of dead records

Revoking or expiring a session, and using or replacing a code or reset link, only marks the row. Without cleanup
`sessions` and `auth_tokens` would grow forever and keep hashes and user agents nobody needs.

- `AuthCleanupService` (`backend/src/auth/sessions/auth-cleanup.service.ts`) runs **every day at 03:00** server time
  (`@nestjs/schedule`, `@Cron`). In one transaction it deletes:
  - sessions that expired or were revoked more than a day ago;
  - auth tokens (verification codes, reset links) that expired or were used more than a day ago.
- **Why keep them a day (`CLEANUP_RETENTION_DAYS = 1`).** The newest token is still read after it is dead: the
  60-second resend / reset cooldown counts from its `created_at`, and `verifyEmail` answers `expired` or
  `already been used` from it. Deleting at once would break both.
- Only the counts are logged. Deleting is safe to run twice, so several backend instances running the job at
  the same time is harmless.
- `auth_tokens.expires_at` has no index, so the delete scans the table. That is fine at our size; add
  `@@index([expiresAt])` if the table ever grows large.
- `@nestjs/schedule` is pinned to **v6**: v12 ships ESM only, which the CommonJS backend can load in Node but Jest
  cannot. v6 has the same API and supports Nest 11.

## Operations

| Operation                                      | Access                  | Result                                                                         |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `signUp(input: SignUpInput!): User!`           | Public                  | creates an Employee, starts a session, sets both cookies                       |
| `signIn(input: SignInInput!): User!`           | Public                  | starts a session, sets both cookies                                            |
| `refresh: Boolean!`                            | Public                  | rotates the refresh token from the cookie, sets both cookies                   |
| `logout: Boolean!`                             | Public                  | revokes the session of the refresh cookie (if any), always clears both cookies |
| `me: User!`                                    | All                     | the current user                                                               |
| `verifyEmail(input: VerifyEmailInput!): User!` | All, `@AllowUnverified` | checks the code of the current user, returns the verified user                 |
| `resendVerificationCode: Boolean!`             | All, `@AllowUnverified` | sends a new code to the current user (also used by Profile → VERIFY EMAIL)     |

- Input validation (both inputs): email required and valid (trimmed), password 6–128 characters. Messages match
  the wiki: `Email is required`, `Please enter a valid email address`, `Password is required`,
  `Password must be at least 6 characters long`.
- `SignUpInput` also has `confirmPassword`, checked on the server too (`@MatchesField('password')` from
  `common/validation`): `Confirm Password is required`, `Passwords do not match` (field `confirmPassword`).
- `signIn` with a wrong email or password returns `UNAUTHENTICATED` with `Invalid email or password`. An unknown
  email still runs a password check against a dummy hash, so the response time does not reveal which emails exist.
  The frontend must not try `refresh` on this error.
- `signUp` with a taken email returns `CONFLICT` with `field: "email"` and
  `An account with this email already exists`.
- `refresh` without a valid session returns `UNAUTHENTICATED` and clears both cookies (a dead refresh cookie
  would make the frontend proxy treat the user as signed in). Exception: the token was replaced less than
  30 seconds ago by a parallel refresh — see "Parallel refresh" above. A replaced token that comes later also
  revokes the session — see "Refresh token reuse".
- `logout` is public so it works after the access token has expired; otherwise the browser would keep httpOnly
  cookies the frontend cannot delete.

## Sign up and email verification

- **Sign up** creates the user (role `EMPLOYEE`, email not verified), starts a session and sends a verification
  code. The user is redirected to the Email Verification page already signed in.
- **Verification uses the session**, not email + code: the backend takes the user from the auth context. This
  lets LATER open the app without signing in again and prevents guessing codes for someone else's email.
  "Public" for this page in the access matrix means "no role required"; a session is still required.
- **Status** is `users.email_verified_at` (`null` = not verified). GraphQL exposes the same value as
  `User.emailVerifiedAt: DateTime` (see [shared entity types](api/conventions.md#shared-entity-types)).
- **Codes** are 6 digits, generated with a secure random source, stored as hashes in `auth_tokens`, valid for
  10 minutes and single-use. A new code invalidates the previous one. Verify and resend are rate-limited.
- Verifying sets `users.email_verified_at` and `auth_tokens.used_at` in one transaction.
- Only the **newest** code is checked; an older code answers `Invalid verification code`.
- **5 wrong attempts per code** (`MAX_CODE_ATTEMPTS`, counted in `auth_tokens.attempts`). After that even the right
  code answers `Verification code has expired` and the user asks for a new one. The limit is per code, not per IP,
  so changing IPs does not help: with a new code at most once a minute, guessing is at most 5 tries a minute
  against a million values. The spec has no "too many attempts" text, so the existing expired message is reused.
- The code is compared with the stored hash in constant time (`matchesHash`).
- If the email cannot be sent during sign up, the account and the session are still created (the failure is
  logged without the code); the user asks for a new code on the verification page.
- Errors of `verifyEmail` (the frontend maps them by `fields[0].message`):

  | Case                    | Code             | Message                                                               |
  | ----------------------- | ---------------- | --------------------------------------------------------------------- |
  | empty / not 6 digits    | `BAD_USER_INPUT` | `Verification code is required` / `Please enter a valid 6-digit code` |
  | wrong code              | `BAD_USER_INPUT` | `Invalid verification code`                                           |
  | expired / 5 wrong tries | `BAD_USER_INPUT` | `Verification code has expired`                                       |
  | already used            | `BAD_USER_INPUT` | `Verification code has already been used`                             |
  | email already verified  | `CONFLICT`       | `Email is already verified`                                           |

- `resendVerificationCode` within 60 seconds of the previous code returns `RATE_LIMITED` with `retryAfter`
  (seconds) and `Please wait before requesting another code`.

### Unverified users are read-only

- They can run queries, but every mutation is rejected with `EMAIL_NOT_VERIFIED` except the ones marked
  `@AllowUnverified()` (verify email, resend code, CV PDF export) and the public ones (refresh, logout, password reset).
  Theme and language are kept in the browser, not on the backend, so an unverified user can still change them
  (see [data-model.md](data-model.md#decisions)).
- Changing the password in Settings is also blocked. Forgot / Reset password still works.
- The spec does not list which features need a verified email (Email Verification AC-16), so this rule is a
  team decision.

### Users created by an Admin

- They are created **not verified**: the admin has no access to the user's mailbox, and the spec allows email
  verification only on the user's own profile.
- No email is sent on creation (a code would expire before the first sign-in). The user verifies their email
  after signing in via Profile → VERIFY EMAIL.
- Seed accounts are created verified for local development.

## Password reset

Mutations (both public): `requestPasswordReset(input: { email })` and `resetPassword(input: { token, newPassword, confirmPassword })`,
code in `backend/src/auth/password-reset/`.

- The forgot-password response is the same whether the email exists or not (no account enumeration): it always
  returns `true`, **before** the request is processed. The resolver starts the lookup, token and email in the
  background and answers at once: for an unknown email the work stops after one query, for an existing one it
  runs a transaction, so waiting for it would let the response time reveal which emails exist. Failures are
  logged without the email (mail failures with the user id only). Input validation and the throttler still run
  before the answer, so a malformed email or too many requests are reported as usual.
  - Downside: if the database is down, the user still sees the generic confirmation. For this operation that
    is acceptable, the answer says nothing anyway. A request lost in a server restart is simply sent again.
  - Integration tests wait for the background work with `t.settled()` (`backend/test/utils/test-app.ts`)
    before reading the email.
- The reset token is random (`generateToken`), stored as a hash in `auth_tokens` (type `PASSWORD_RESET`), expires
  in **30 minutes** and is single-use. A new request expires the previous unused link.
- Per-account cooldown: a second request within **60 seconds** is ignored silently. It cannot return
  `RATE_LIMITED`, because that would reveal that the account exists; per-client limits come from the throttler.
- Reset link: `${FRONTEND_URL}/reset-password?token=<token>`. The Reset Password page sends the token back with the
  new password.
- `resetPassword` errors are `BAD_USER_INPUT` with field `token`: `This password reset link is invalid` (unknown,
  malformed or already used token) and `This password reset link has expired`.
- Resetting updates the password hash, marks the token used and revokes all sessions in one transaction. The token
  is marked used with a conditional update, so two parallel requests with the same link cannot both succeed.
- Resetting does not mark the email as verified: verification stays a separate flow.
- The user is not signed in automatically: the frontend redirects to Sign In with a success message.

## Change password

Mutation (signed-in, verified email): `changePassword(input: { currentPassword, newPassword, confirmPassword }): Boolean!`,
code in `backend/src/auth/change-password/`. Used by the Change Password form on the Settings page.

- The user comes from the auth context; the input has no `userId`, so nobody can change another user's password,
  an Admin included.
- Input validation: `Password is required` (field `currentPassword`), `New password is required`,
  `Password must be at least 6 characters long`, `Password must not exceed 128 characters`,
  `Confirm password is required` (lower-case "p", as on the Settings page; Sign Up uses `Confirm Password`) and
  `Passwords do not match`. The current password has no minimum length: it is checked against the stored hash, so
  an account with an older, shorter password can still change it. It is capped at 128 characters.
- Errors from the service, both `BAD_USER_INPUT`:

  | Case                            | Field             | Message                                                    |
  | ------------------------------- | ----------------- | ---------------------------------------------------------- |
  | current password does not match | `currentPassword` | `Current password is incorrect`                            |
  | new password equals the current | `newPassword`     | `New password must be different from the current password` |

  The second rule is a team decision; the spec only names `Password does not meet the security requirements`.

- On success the new hash is stored and every other active session of the user is revoked, in one transaction.
  The current session keeps working, so the user stays on the Settings page and the form is reset.
- Rate-limited with `@AuthThrottle()` (see [Rate limiting](#rate-limiting)) against guessing the current password.
- Passwords and hashes are never returned or logged.

## Email language

Verification and password reset emails come in the language the app is shown in, one of the nine app languages.

| Email               | Sent by                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| verification code   | `signUp`; `resendVerificationCode` (Resend code, Profile → VERIFY EMAIL) |
| password reset link | `requestPasswordReset` (Forgot Password)                                 |

- **Where the language comes from.** The frontend sends the app language in the `Accept-Language` header of every
  GraphQL request (`frontend/src/shared/lib/apollo/locale-link.ts`). The app language is the one chosen in Settings,
  otherwise the browser language, otherwise English (see the i18n section of `frontend/README.md`), so the email and
  the page the user just saw are in the same language. A client that sends no header of its own (e.g. a direct API
  call) gets the browser's header, which works the same way.
- **On the backend** the `@RequestLocale()` param decorator (`backend/src/common/i18n/`) picks the language with
  `negotiateLocale`: it ranks the header by `q`, takes the primary subtag (`pt-BR` → `pt`) and returns the first
  app language, or `en` if none matches. The resolver passes it through the service to `MailService`.
- **Not stored.** The language is not saved on the user: like the theme, it belongs to the browser
  ([data-model.md](data-model.md), decisions), so it comes with each request. An email sent without a request
  (none exists today) would have to fall back to English.
- **Safe to trust.** The header only picks a translation and grants nothing; unknown values fall back to `en`.
- **Texts** live in `backend/src/mail/mail.translations.ts` (`MAIL_STRINGS`, one entry per language);
  `mail.templates.ts` builds the text and HTML versions from them. Minutes are pluralized with `Intl.PluralRules`
  (`1 минуту`, `3 минуты`, `10 минут`). The list of languages is the GraphQL `Locale` enum
  (`backend/src/common/graphql/locale.enum.ts`, shared with the CV PDF), so a language added there fails the
  type-check until its email texts exist.

## Rate limiting

`@nestjs/throttler` counts requests per client IP in memory. `GqlThrottlerGuard`
(`backend/src/common/throttling/`) is the first global guard, so a throttled request never reaches the auth guard
or the database.

| Operations                                                                                                                                 | Limit per IP                             |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `signUp`, `signIn`, `requestPasswordReset`, `resetPassword`, `changePassword`, `verifyEmail`, `resendVerificationCode` (`@AuthThrottle()`) | 10 per minute, each operation separately |
| `generateCvPdf` (`@PdfThrottle()`, see [pdf.md](pdf.md#limits))                                                                            | 10 per minute                            |
| every other operation                                                                                                                      | 100 per minute                           |
| `health` query and `GET /health` (`@SkipThrottle()`)                                                                                       | none                                     |

- Over the limit: `RATE_LIMITED` with `Please wait before trying again` and `retryAfter` in seconds. The HTTP
  response also has a `Retry-After` header, and every response has `X-RateLimit-Limit` / `-Remaining` / `-Reset`.
- These limits come on top of the per-account rules: 60 s cooldown for resending a code (`RATE_LIMITED`) and for
  requesting a reset link (ignored silently, see [Password reset](#password-reset)).
- The counters live in the API process: they reset on restart and are not shared between several instances.
  A shared store (Redis) is needed only if the API is scaled out.
- Behind a reverse proxy every request comes from the proxy's IP, so all clients would share one limit. Set
  `TRUST_PROXY_HOPS` to the number of proxies so Express takes the client IP from `X-Forwarded-For`. Do not set it
  higher than the real number: a client could then fake its IP in that header.

## Hashing and random values

Helpers live in `backend/src/common/crypto/`; other modules use them instead of calling `argon2` or `node:crypto`
directly.

| Secret                              | Generated with                                    | Stored as                      |
| ----------------------------------- | ------------------------------------------------- | ------------------------------ |
| Password                            | chosen by the user                                | argon2id hash (`hashPassword`) |
| Refresh token, password reset token | `generateToken`: 32 random bytes, base64url       | sha256 hex (`hashToken`)       |
| Email verification code             | `generateVerificationCode`: 6 digits, `randomInt` | sha256 hex (`hashToken`)       |

- **Passwords use argon2id** because people choose weak passwords: a slow, salted hash makes guessing them from a
  leaked database too expensive. `verifyPassword` returns `false` for a malformed stored hash instead of throwing.
- **Tokens use sha256**: they are long random values that cannot be guessed, so a fast hash is enough, and it lets
  the database find a token by its hash.
- A verification code has only a million values, so its sha256 hash alone could be brute-forced from a leaked
  database. The 10-minute expiry, single use and rate limits keep that window small.
- Random values come from `node:crypto`, never from `Math.random()`, which is predictable.

## Configuration

| Variable                 | Used for                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`      | Signing and verifying access tokens (≥ 32 chars, never committed)                   |
| `JWT_ACCESS_TTL_SECONDS` | Access token lifetime and its cookie `maxAge`                                       |
| `REFRESH_TTL_DAYS`       | Refresh token lifetime (sliding)                                                    |
| `FRONTEND_URL`           | CORS origin and links in emails                                                     |
| `SMTP_HOST`, `SMTP_PORT` | Mail server; Mailpit in local development                                           |
| `MAIL_FROM`              | Sender of verification and reset emails                                             |
| `TRUST_PROXY_HOPS`       | Reverse proxies in front of the API, for the client IP in rate limits (default `0`) |

Emails are sent by `MailService` (`backend/src/mail/`, nodemailer over SMTP); their texts are in
`mail.translations.ts`, in the language of the request (see [Email language](#email-language)). Codes and reset links appear only in the email itself, never in logs or error messages.

All variables are validated on startup in `backend/src/config/env.validation.ts`; the app does not start if one
is missing or invalid. In local development every email lands in Mailpit: http://localhost:8025.
