import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import type { ApiResponse } from '@videochat/shared';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    const body: ApiResponse = { success: false, error: err.message };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('[api] unhandled error', err);
  const body: ApiResponse = { success: false, error: 'Internal server error' };
  res.status(500).json(body);
}

