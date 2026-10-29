export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const AuthRoute = {
  signIn: '/login',
  signUp: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  home: '/',
} as const;

/** Pages only for signed-out users: a signed-in user is sent to the app. */
export const GUEST_ONLY_ROUTES: readonly string[] = [AuthRoute.signIn, AuthRoute.signUp];

/** Pages open to everyone, signed in or not. */
export const PUBLIC_ROUTES: readonly string[] = [AuthRoute.forgotPassword, AuthRoute.resetPassword];

export const RESEND_CODE_COOLDOWN_SECONDS = 60;
