import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = (req as any).user?.tenantId;
  
  // For SaaS Admins or public endpoints, we might have different rules, 
  // but for tenant-specific routes, this middleware ensures tenantId is present.
  if (!tenantId) {
    return next(new AppError('Tenant ID is missing or you do not belong to a tenant', 'TENANT_NOT_FOUND', 403));
  }
  
  (req as any).tenantId = tenantId;
  next();
};
