import { NotificationRepository } from '../repositories/NotificationRepository';
import { TenantRepository } from '../repositories/TenantRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';

const notificationRepo = new NotificationRepository();
const tenantRepo = new TenantRepository();

export class NotificationService {
  async queueNotification(tenantId: string, userId: string, payload: { type: string, channel: 'EMAIL' | 'SMS', subject: string, message: string }) {
    if (tenantId) {
      const tenant = await tenantRepo.findById(tenantId);
      if (tenant) {
        if (payload.channel === 'EMAIL' && tenant.emailEnabled === false) {
          console.log(`Skipping EMAIL notification ${payload.type} for tenant ${tenantId} (emailEnabled is false)`);
          return;
        }
        if (payload.channel === 'SMS' && tenant.smsEnabled === false) {
          console.log(`Skipping SMS notification ${payload.type} for tenant ${tenantId} (smsEnabled is false)`);
          return;
        }
      }
    }

    const notifId = generateId(IdPrefix.NOTIFICATION);
    
    // We intentionally don't await/block on this in the caller if we want it fully async,
    // but typically we can await the db write to ensure it's queued.
    return notificationRepo.create(notifId, {
      ...payload,
      tenantId,
      userId,
      status: 'QUEUED',
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM'
    });
  }
}
