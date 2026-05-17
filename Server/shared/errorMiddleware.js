/**
 * Central error handler.
 *
 * Maps:
 *   - AppError       → its statusCode + { code, message, details }
 *   - Mongoose ValidationError → 422 + path-keyed details
 *   - Mongoose CastError       → 400 (bad object id, etc.)
 *   - Mongo duplicate key (11000) → 409
 *   - Anything else  → 500, message hidden in prod
 *
 * Always returns a consistent envelope:
 *   { success: false, error: { code, message, details? }, requestId }
 */
const env = require("../config/env");
const { AppError } = require("./errors");

function notFoundHandler(req, _res, next) {
  next(new AppError("ROUTE_NOT_FOUND", 404, `Route not found: ${req.method} ${req.path}`));
}

function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details;

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err?.name === "ValidationError" && err?.errors) {
    // Mongoose validation
    status = 422;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = Object.entries(err.errors).map(([path, e]) => ({
      path,
      message: e.message,
      kind: e.kind,
    }));
  } else if (err?.name === "CastError") {
    status = 400;
    code = "BAD_REQUEST";
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    code = "CONFLICT";
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  } else if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    status = 401;
    code = "INVALID_TOKEN";
    message = "Invalid or expired token";
  } else if (typeof err?.status === "number" && err.status >= 400 && err.status < 600) {
    // body-parser / http-errors style exceptions (PayloadTooLargeError, etc.)
    // already carry an HTTP status — honor it instead of masking as a 500.
    status = err.status;
    code = err.type || err.code || (err.status >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
    message = err.message || message;
  } else if (typeof err?.message === "string" && err.message) {
    // Unknown 500. Keep status/code at the catch-all but surface the raw
    // message so devs can debug. The body-level production check below still
    // suppresses this for non-test prod responses.
    message = err.message;
  }

  // Log: stack only for unexpected errors. Operational AppErrors are noise at warn.
  const log = req.log || require("./logger");
  if (status >= 500) {
    log.error({ err, code, status }, "request failed");
  } else {
    log.warn({ code, status, msg: message }, "request rejected");
  }

  const body = {
    success: false,
    error: {
      code,
      message: status >= 500 && env.NODE_ENV === "production" ? "Internal server error" : message,
      ...(details ? { details } : {}),
    },
    requestId: req.id,
  };

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
