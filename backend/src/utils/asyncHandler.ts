import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to Express's
 * error-handling middleware via next(). Removes repetitive try/catch blocks and
 * guarantees an async route can never throw an unhandled rejection.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}