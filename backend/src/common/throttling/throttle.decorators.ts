import { Throttle, type ThrottlerOptions } from '@nestjs/throttler';

const MINUTE_MS = 60 * 1000;

export const DEFAULT_THROTTLE: ThrottlerOptions = { name: 'default', ttl: MINUTE_MS, limit: 100 };

export const AUTH_THROTTLE_LIMIT = 10;

export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { ttl: MINUTE_MS, limit: AUTH_THROTTLE_LIMIT } });
