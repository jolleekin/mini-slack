export type AppErrorCode =
  | "INTERNAL"
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CONFLICT";

/**
 * Base class for all application errors.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: AppErrorCode = "INTERNAL",
    metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
    metadata?: Record<string, unknown>,
  ) {
    super(message, "NOT_FOUND", metadata);
  }
}

/**
 * Thrown when validation fails (400).
 */
export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    metadata?: Record<string, unknown>,
  ) {
    super(message, "VALIDATION", metadata);
  }
}

/**
 * Thrown when authentication is required (401).
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", metadata?: Record<string, unknown>) {
    super(message, "UNAUTHENTICATED", metadata);
  }
}

/**
 * Thrown when a user doesn't have permission (403).
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", metadata?: Record<string, unknown>) {
    super(message, "FORBIDDEN", metadata);
  }
}

/**
 * Thrown when a conflict occurs (409).
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict", metadata?: Record<string, unknown>) {
    super(message, "CONFLICT", metadata);
  }
}
