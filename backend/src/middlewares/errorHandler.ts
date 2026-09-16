import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { generateId, IdPrefix } from '../utils/idGenerator';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || generateId(IdPrefix.REQUEST);
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      requestId
    });
  }

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId
  });
};
