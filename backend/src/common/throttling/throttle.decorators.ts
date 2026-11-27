import { Throttle, type ThrottlerOptions } from '@nestjs/throttler';
import { MINUTE_MS } from '@/common/time';

export const DEFAULT_THROTTLE: ThrottlerOptions = { name: 'default', ttl: MINUTE_MS, limit: 100 };

export const AUTH_THROTTLE_LIMIT = 10;

export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { ttl: MINUTE_MS, limit: AUTH_THROTTLE_LIMIT } });

export const PDF_THROTTLE_LIMIT = 10;

export const PdfThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { ttl: MINUTE_MS, limit: PDF_THROTTLE_LIMIT } });
