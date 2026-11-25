// Cause within an ErrorCode; the frontend uses it only to pick the text. A different reaction needs a new ErrorCode.
export enum ErrorReason {
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
  TOO_LARGE = 'TOO_LARGE',
  INVALID_TYPE = 'INVALID_TYPE',
  SELF = 'SELF',
  LAST_ADMIN = 'LAST_ADMIN',
}
