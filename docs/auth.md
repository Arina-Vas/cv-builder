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
- The Next.js middleware uses the cookie to redirect between auth pages and the app.

| Token   | Format                                                      | Lifetime                              | Stored in the DB                 |
| ------- | ----------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| Access  | JWT signed with `JWT_ACCESS_SECRET`, `{ sub: userId, sid }` | 30 minutes (`JWT_ACCESS_TTL_SECONDS`) | no                               |
| Refresh | random value                                                | 1 day, sliding (`REFRESH_TTL_DAYS`)   | hash only, `sessions.token_hash` |

- Role and verification status are not stored in the access token.
- Every refresh **rotates** the refresh token (new value, new expiry), so an old refresh token stops working.
  Rotation is a conditional update on the old hash, so two parallel refreshes with the same token cannot both
  succeed.
  An active user stays signed in; a user who is inactive for more than a day signs in again.

## Sessions and the auth guard

- One `sessions` row per sign-in; several devices at once are allowed.
- The auth guard checks the JWT, then loads the user and the session from the database on every request. A role
  change, a revoked session or a deleted user takes effect immediately, not when the access token expires.
- Logout revokes the current session and clears both cookies.
- Password reset revokes all sessions of the user.

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
- `signIn` with a wrong email or password returns `UNAUTHENTICATED` with `Invalid email or password`. An unknown
  email still runs a password check against a dummy hash, so the response time does not reveal which emails exist.
  The frontend must not try `refresh` on this error.
- `signUp` with a taken email returns `CONFLICT` with `field: "email"` and
  `An account with this email already exists`.
- `refresh` without a valid session returns `UNAUTHENTICATED` and clears both cookies.
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
- A new code expires the previous unused ones, so an old code answers `Verification code has expired`.
- If the email cannot be sent during sign up, the account and the session are still created (the failure is
  logged without the code); the user asks for a new code on the verification page.
- Errors of `verifyEmail` (the frontend maps them by `fields[0].message`):

  | Case                   | Code             | Message                                                               |
  | ---------------------- | ---------------- | --------------------------------------------------------------------- |
  | empty / not 6 digits   | `BAD_USER_INPUT` | `Verification code is required` / `Please enter a valid 6-digit code` |
  | wrong code             | `BAD_USER_INPUT` | `Invalid verification code`                                           |
  | expired or replaced    | `BAD_USER_INPUT` | `Verification code has expired`                                       |
  | already used           | `BAD_USER_INPUT` | `Verification code has already been used`                             |
  | email already verified | `CONFLICT`       | `Email is already verified`                                           |

- `resendVerificationCode` within 60 seconds of the previous code returns `RATE_LIMITED` with `retryAfter`
  (seconds) and `Please wait before requesting another code`.

### Unverified users are read-only

- They can run queries, but every mutation is rejected with `EMAIL_NOT_VERIFIED` except the ones marked
  `@AllowUnverified()`: verify email, resend code, refresh, logout, theme and language.
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

- The forgot-password response is the same whether the email exists or not (no account enumeration).
- The reset token is random, stored as a hash in `auth_tokens`, expiring and single-use.
- Resetting updates the password hash, marks the token used and revokes all sessions in one transaction.
- The user is not signed in automatically: the frontend redirects to Sign In with a success message.

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

| Variable                 | Used for                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`      | Signing and verifying access tokens (≥ 32 chars, never committed) |
| `JWT_ACCESS_TTL_SECONDS` | Access token lifetime and its cookie `maxAge`                     |
| `REFRESH_TTL_DAYS`       | Refresh token lifetime (sliding)                                  |
| `FRONTEND_URL`           | CORS origin and links in emails                                   |
| `SMTP_HOST`, `SMTP_PORT` | Mail server; Mailpit in local development                         |
| `MAIL_FROM`              | Sender of verification and reset emails                           |

Emails are sent by `MailService` (`backend/src/mail/`, nodemailer over SMTP); their texts are in
`mail.templates.ts`. Codes and reset links appear only in the email itself, never in logs or error messages.

All variables are validated on startup in `backend/src/config/env.validation.ts`; the app does not start if one
is missing or invalid. In local development every email lands in Mailpit: http://localhost:8025.
