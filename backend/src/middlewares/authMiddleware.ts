import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AppError } from '../utils/AppError';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 'UNAUTHORIZED', 401));
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
    };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 'UNAUTHORIZED', 401));
  }
};

export const requireSaaSAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const firebaseUid = (req as any).user?.firebaseUid;
    if (!firebaseUid) {
      return next(new AppError('Unauthorized access', 'UNAUTHORIZED', 401));
    }
    
    // Dynamically require to avoid circular dependency if any
    const { UserRepository } = require('../repositories/UserRepository');
    const userRepo = new UserRepository();
    const user = await userRepo.findByFirebaseUid(firebaseUid);

    if (!user || user.userType !== 'SAAS_ADMIN') {
      return next(new AppError('Forbidden: SaaS Admin access required', 'FORBIDDEN', 403));
    }
    
    // Attach the full user context for the admin
    (req as any).adminUser = user;
    next();
  } catch (error) {
    next(new AppError('Authorization failed', 'INTERNAL_SERVER_ERROR', 500));
  }
};

export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const firebaseUid = (req as any).user?.firebaseUid;
    if (!firebaseUid) return next(new AppError('Unauthorized access', 'UNAUTHORIZED', 401));

    const { UserRepository } = require('../repositories/UserRepository');
    const userRepo = new UserRepository();
    const user = await userRepo.findByFirebaseUid(firebaseUid);

    if (!user || user.userType !== 'OWNER') {
      return next(new AppError('Forbidden: Owner access required', 'FORBIDDEN', 403));
    }

    (req as any).ownerUser = user;
    next();
  } catch (error) {
    next(new AppError('Authorization failed', 'INTERNAL_SERVER_ERROR', 500));
  }
};

export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  const isVerified = (req as any).user?.emailVerified;
  if (!isVerified) {
    return next(new AppError('Email verification required', 'FORBIDDEN', 403));
  }
  next();
};

export const requireOperationalTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).ownerUser || (req as any).staffUser; // Assume previously loaded by requireOwner/Staff
    if (!user || !user.tenantId) {
      return next(new AppError('Unauthorized: No tenant associated', 'UNAUTHORIZED', 401));
    }

    const { TenantRepository } = require('../repositories/TenantRepository');
    const { SubscriptionRepository } = require('../repositories/SubscriptionRepository');
    
    const tenantRepo = new TenantRepository();
    const subRepo = new SubscriptionRepository();

    const tenant = await tenantRepo.findById(user.tenantId);
    if (!tenant) return next(new AppError('Tenant not found', 'NOT_FOUND', 404));

    if (tenant.accountStatus !== 'ACTIVE') {
      return next(new AppError('Account is not active', 'FORBIDDEN', 403));
    }

    if (tenant.profileStatus !== 'VERIFIED') {
      return next(new AppError('Business profile must be verified before proceeding', 'FORBIDDEN', 403));
    }

    const subscriptions = await subRepo.findByQuery('tenantId', '==', user.tenantId, user.tenantId);
    const activeSub = subscriptions.find((s: any) => s.status === 'ACTIVE' || s.status === 'TRIAL');

    if (!activeSub) {
      return next(new AppError('No active or trial subscription found', 'FORBIDDEN', 403));
    }

    (req as any).tenant = tenant;
    (req as any).activeSubscription = activeSub;
    next();
  } catch (error) {
    next(new AppError('Operational validation failed', 'INTERNAL_SERVER_ERROR', 500));
  }
};
