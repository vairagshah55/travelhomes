/**
 * Domain error class. Anything thrown that isn't an `AppError` is treated as
 * a 500 by the central error middleware.
 *
 * Usage:
 *   throw new BadRequestError("Email is required");
 *   throw new NotFoundError("Booking", id);
 *   throw new AppError("CUSTOM_CODE", 422, "Custom message", { details });
 *
 * Convention: `code` is a stable string clients can switch on. `message` is
 * for humans. `details` is structured supporting data (e.g. zod issues).
 */
class AppError extends Error {
  constructor(code, statusCode, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request", details) {
    super("BAD_REQUEST", 400, message, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", 401, message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", 403, message);
  }
}

class NotFoundError extends AppError {
  constructor(resourceOrMessage = "Resource", id) {
    const message = id ? `${resourceOrMessage} ${id} not found` : `${resourceOrMessage} not found`;
    super("NOT_FOUND", 404, message);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict", details) {
    super("CONFLICT", 409, message, details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details) {
    super("VALIDATION_ERROR", 422, message, details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super("TOO_MANY_REQUESTS", 429, message);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
};
