import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET || 'dev-cron-secret-123';

  if (!secret || secret !== expectedSecret) {
    throw new AppError('Unauthorized Cron Trigger', 'UNAUTHORIZED', 401);
  }

  next();
};
