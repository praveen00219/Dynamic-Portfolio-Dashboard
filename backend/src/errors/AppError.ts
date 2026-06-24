/**
 * Base class for known, expected ("operational") application errors.
 *
 * Carries an HTTP status code and an `isOperational` flag. The central error
 * handler uses these to send the correct status and to decide whether the
 * message is safe to return to the client (operational messages are curated;
 * unexpected errors are hidden in production).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    // Keep a clean stack trace pointing at the throw site (V8 only).
    Error.captureStackTrace?.(this, new.target);
  }
}

/** 404 — route or resource not found. */
export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

/** 502 — an upstream data provider (e.g. Yahoo Finance) failed or is unreachable. */
export class UpstreamError extends AppError {
  constructor(message = 'Upstream data provider unavailable') {
    super(message, 502);
  }
}