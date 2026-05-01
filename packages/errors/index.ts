export type AppErrorCode =
  | "INTERNAL"
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CONFLICT";

/**
 * Consumers augment this interface with translation keys and required metadata shapes.
 *
 * Example:
 * declare module "@mini-slack/errors" {
 *   interface AppErrorTranslationKeyMap {
 *     "channels.members.not_found": { channelId: string };
 *   }
 * }
 */
export interface AppErrorTranslationKeyMap {}

export type AppErrorTranslationKey =
  keyof AppErrorTranslationKeyMap extends never
    ? string
    : keyof AppErrorTranslationKeyMap;

export type AppErrorOptions = keyof AppErrorTranslationKeyMap extends never
  ? {
      metadata?: Record<string, unknown>;
      i18nKey?: string;
    }
  : {
      [K in keyof AppErrorTranslationKeyMap]: AppErrorTranslationKeyMap[K] extends never
        ? { i18nKey: K; metadata?: never }
        : { i18nKey: K; metadata: AppErrorTranslationKeyMap[K] };
    }[keyof AppErrorTranslationKeyMap];

/**
 * Base class for all application errors.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly i18nKey?: AppErrorTranslationKey;
  readonly data?: Record<string, unknown>;

  constructor(code: AppErrorCode, options: AppErrorOptions = {}) {
    super();
    this.code = code;
    this.i18nKey = options.i18nKey;
    this.data = options.metadata;
  }
}

export class NotFoundError extends AppError {
  constructor(options?: AppErrorOptions) {
    super("NOT_FOUND", options);
  }
}

export class ValidationError extends AppError {
  constructor(options?: AppErrorOptions) {
    super("VALIDATION", options);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(options?: AppErrorOptions) {
    super("UNAUTHENTICATED", options);
  }
}

export class ForbiddenError extends AppError {
  constructor(options?: AppErrorOptions) {
    super("FORBIDDEN", options);
  }
}

export class ConflictError extends AppError {
  constructor(options?: AppErrorOptions) {
    super("CONFLICT", options);
  }
}
