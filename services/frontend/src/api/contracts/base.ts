/* ============================================================
   Base API & Error Contracts
   Must strictly match backend Pydantic models.
============================================================ */

/*
  Standard Error Response Payload
  Mirrors backend ErrorPayload model exactly.
*/
export interface ErrorPayload {
  code: string;
  message: string;
}

/*
  Global API Response Contract
  Mirrors backend ApiResponse model.
*/
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorPayload | null;
}

/*
  Generic Pagination Interface
  Used for list endpoints.
*/
export interface PaginatedData<T> {
  items: T[];
  total: number;
}

/* ============================================================
   DB Error Codes (Synced With Backend Contract)
   These MUST match backend ERROR_CODE_MAP.
============================================================ */

export const DB_ERRORS = {
  AUTH: {
    UNAUTHENTICATED: 'DB0001',
  },

  TENANT: {
    NOT_FOUND: 'DB0101',
    ONLY_OWNER: 'DB0102',
    MULTIPLE_OWNERS: 'DB0103',
    INVALID_NAME: 'DB0104',
  },

  MEMBERSHIP: {
    NO_PERMISSION: 'DB0201',
    NOT_MEMBER: 'DB0202',
    LAST_OWNER: 'DB0203',
    ALREADY_MEMBER: 'DB0204',
    INVALID_ROLE: 'DB0205',
    SELF_REMOVAL_NOT_ALLOWED: 'DB0206',
    ADMIN_CANNOT_REMOVE: 'DB0207',
    CALLER_NOT_MEMBER: 'DB0208',
    LAST_OWNER_LEAVE: 'DB0209',
  },

  REQUEST_INVITATION: {
    NOT_FOUND: 'DB0301',
    CANNOT_APPROVE_INVITATION: 'DB0302',
    CANNOT_ACCEPT_JOIN: 'DB0303',
    ONLY_PENDING: 'DB0304',
    NOT_AUTHORIZED: 'DB0305',
    BLOCKED_BY_INVITATION: 'DB0306',
    BLOCKED_BY_JOIN_REQUEST: 'DB0307',
    JOIN_REQUEST_EXISTS: 'DB0308',
    INVITATION_EXISTS: 'DB0309',
    TARGET_USER_NOT_EXIST: 'DB0310',
    ONLY_OWNER_OR_ADMIN: 'DB0311',
    ONLY_OWNER_ADMIN_CANCEL: 'DB0312',
  },

  NOTE: {
    NOT_FOUND: 'DB0401',
    ONLY_OWNER: 'DB0402',
    TENANT_INACTIVE: 'DB0403',
  },

  SHARE: {
    SELF_SHARE: 'DB0501',
    INVALID_PERMISSION: 'DB0502',
    TARGET_NOT_MEMBER: 'DB0503',
    ONLY_OWNER_CHANGE: 'DB0504',
    NOTE_NOT_FOUND: 'DB0505',
    CALLER_NOT_TENANT_MEMBER: 'DB0506',
  },
} as const;

/* ============================================================
   Type Utilities
============================================================ */

/*
  Extract nested string literal values
*/
type ValueOf<T> = T[keyof T];

type DeepValueOf<T> = T extends object
  ? DeepValueOf<ValueOf<T>>
  : T;

/*
  Strongly-typed DB error code union
*/
export type ErrorCode = DeepValueOf<typeof DB_ERRORS>;

/* ============================================================
   UI-Level Error Helpers
   Frontend should NOT duplicate backend domain logic.
============================================================ */

/*
  Optional: map DB error codes to i18n message keys
  This allows localization later.
*/
export const ERROR_MESSAGE_KEYS: Partial<Record<ErrorCode, string>> = {
  DB0001: 'error.auth.unauthenticated',
  DB0203: 'error.membership.last_owner',
  DB0101: 'error.tenant.not_found',
};

/*
  Fallback generic message
*/
export const DEFAULT_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again.';

/*
  Resolve user-facing message.
  Prefer backend message unless overridden by UI mapping.
*/
export function resolveErrorMessage(
  error: ErrorPayload | null
): string {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  /*
    Prefer backend-provided message.
    Override only when necessary (UX-specific).
  */
  return error.message || DEFAULT_ERROR_MESSAGE;
}

/*
  Type guard for DB error codes.
*/
export function isKnownErrorCode(code: string): code is ErrorCode {
  return Object.values(DB_ERRORS)
    .flatMap((domain) => Object.values(domain))
    .includes(code as ErrorCode);
}

/*
  Convenience helper:
  Check if response contains error.
*/
export function hasError<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { error: ErrorPayload } {
  return !response.success && response.error !== null;
}
