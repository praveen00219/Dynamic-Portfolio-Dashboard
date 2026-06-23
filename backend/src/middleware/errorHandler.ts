import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.url} —`, error.message);

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
}