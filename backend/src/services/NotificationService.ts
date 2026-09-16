import { NotificationRepository } from '../repositories/NotificationRepository';
import { generateId, IdPrefix } from '../utils/idGenerator';

const notificationRepo = new NotificationRepository();

export class NotificationService {
  async queueNotification(tenantId: string, userId: string, payload: { type: string, channel: 'EMAIL' | 'SMS', subject: string, message: string }) {
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
