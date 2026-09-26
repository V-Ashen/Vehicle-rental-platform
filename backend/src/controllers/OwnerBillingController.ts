import { Request, Response, NextFunction } from 'express';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PackageRepository } from '../repositories/PackageRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentRequestRepository } from '../repositories/PaymentRequestRepository';
import { AppError } from '../utils/AppError';

const subRepo = new SubscriptionRepository();
const packageRepo = new PackageRepository();
const paymentRepo = new PaymentRepository();
const paymentRequestRepo = new PaymentRequestRepository();

export class OwnerBillingController {
  
  getSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).ownerUser.tenantId;
      
      // Get the most recent subscription
      const subs = await subRepo.findAllPaginated(1, undefined, 'createdAt', 'desc', [
        { field: 'tenantId', operator: '==', value: tenantId }
      ]);
      
      const subscription = subs.data[0];
      if (!subscription) {
        return res.status(200).json({ success: true, data: null });
      }

      // Join the package details
      const pkg = await packageRepo.findById(subscription.packageId);
      
      res.status(200).json({ 
        success: true, 
        data: {
          ...subscription,
          package: pkg
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).ownerUser.tenantId;
      
      // Get approved/online payments
      const payments = await paymentRepo.findByQuery('tenantId', '==', tenantId);
      
      // Get pending bank transfers (payment requests)
      const paymentRequests = await paymentRequestRepo.findByQuery('tenantId', '==', tenantId);
      
      // Sort them combined by date descending
      const getTime = (dateObj: any) => {
        if (!dateObj) return 0;
        if (typeof dateObj.toDate === 'function') return dateObj.toDate().getTime();
        if (typeof dateObj.getTime === 'function') return dateObj.getTime();
        return new Date(dateObj).getTime();
      };

      const combined = [
        ...payments.map((p: any) => ({ ...p, type: 'PAYMENT', date: p.createdAt })),
        ...paymentRequests.map((pr: any) => ({ ...pr, type: 'PAYMENT_REQUEST', date: pr.submittedAt }))
      ].sort((a, b) => getTime(b.date) - getTime(a.date));

      res.status(200).json({ success: true, data: combined });
    } catch (error) {
      next(error);
    }
  };

  listPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get all active packages
      const packages = await packageRepo.findByQuery('status', '==', 'ACTIVE');
      res.status(200).json({ success: true, data: packages });
    } catch (error) {
      next(error);
    }
  };
}
