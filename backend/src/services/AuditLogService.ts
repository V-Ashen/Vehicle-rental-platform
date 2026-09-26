import { db } from '../config/firebase';
import { generateId, IdPrefix } from '../utils/idGenerator';

export class AuditLogService {
  /**
   * Logs a critical action to the auditLogs collection.
   * 
   * @param tenantId The tenant associated with the action
   * @param userId The user who performed the action
   * @param action A short string identifying the action (e.g. PAYMENT_APPROVED, SUBSCRIPTION_ACTIVATED)
   * @param module The domain module (e.g. BILLING, RENTALS, SETTINGS)
   * @param entityId The ID of the primary entity affected (e.g. paymentId)
   * @param oldData Optional JSON of previous state
   * @param newData Optional JSON of new state
   */
  async logAction(
    tenantId: string | null,
    userId: string,
    action: string,
    module: string,
    entityId: string,
    oldData?: any,
    newData?: any
  ): Promise<string> {
    const logId = generateId(IdPrefix.SYSTEM); // 'SYS-' prefix as it's a system log
    
    const logData = {
      id: logId,
      tenantId: tenantId || 'SYSTEM',
      userId,
      action,
      module,
      entityId,
      oldData: oldData || null,
      newData: newData || null,
      timestamp: new Date(),
    };

    await db.collection('auditLogs').doc(logId).set(logData);
    return logId;
  }
}
