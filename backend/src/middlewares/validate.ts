import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = (error as ZodError).issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(`Validation Error: ${message}`, 'VALIDATION_ERROR', 400));
      } else {
        next(error);
      }
    }
  };
};
