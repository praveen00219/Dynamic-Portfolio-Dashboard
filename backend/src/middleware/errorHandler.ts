import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';
import { AppError, NotFoundError } from '../errors/AppError.js';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

/**
 * Catch-all for unmatched routes. Forwards a typed 404 to the error handler so
 * "not found" responses use the same JSON envelope as every other response
 * (instead of Express's default HTML page). Must be registered after all routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Cannot ${req.method} ${req.url}`));
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Always log full detail server-side (stack when available).
  console.error(`[Error] ${req.method} ${req.url} (${statusCode}) —`, error.stack ?? error.message);

  // Operational errors carry safe, curated messages and can be returned as-is.
  // Any other (unexpected) error is hidden behind a generic message in
  // production to avoid leaking internals such as stack traces or file paths.
  const clientMessage =
    isAppError && error.isOperational
      ? error.message
      : isProd
        ? 'Internal Server Error'
        : error.message || 'Internal Server Error';

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: clientMessage,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}