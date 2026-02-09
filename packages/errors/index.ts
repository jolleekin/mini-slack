/**
 * Base class for all application errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", metadata?: Record<string, unknown>) {
    super(message, 404, metadata);
  }
}

/**
 * Thrown when validation fails (400).
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", metadata?: Record<string, unknown>) {
    super(message, 400, metadata);
  }
}

/**
 * Thrown when authentication is required (401).
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", metadata?: Record<string, unknown>) {
    super(message, 401, metadata);
  }
}

/**
 * Thrown when a user doesn't have permission (403).
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", metadata?: Record<string, unknown>) {
    super(message, 403, metadata);
  }
}

/**
 * Thrown when a conflict occurs (409).
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict", metadata?: Record<string, unknown>) {
    super(message, 409, metadata);
  }
}
