import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { AppError } from '../utils/AppError';

export class NotificationController {
  async getMyNotifications(req: Request, res: Response) {
    try {
      const dbUser = (req as any).ownerUser || (req as any).staffUser || (req as any).adminUser;
      if (!dbUser) throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
      
      const { tenantId, id: uid } = dbUser;
      const isReadParam = req.query.isRead;

      let query = db.collection('notifications')
        .where('tenantId', '==', tenantId)
        .where('userId', '==', uid);

      if (isReadParam !== undefined) {
        const isRead = isReadParam === 'true';
        query = query.where('isRead', '==', isRead);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      res.status(200).json({ success: true, data: notifications });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const dbUser = (req as any).ownerUser || (req as any).staffUser || (req as any).adminUser;
      if (!dbUser) throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
      
      const { tenantId, id: uid } = dbUser;
      const { id } = req.params;

      const notifRef = db.collection('notifications').doc(id);
      const doc = await notifRef.get();

      if (!doc.exists) {
        throw new AppError('Notification not found', 'NOT_FOUND', 404);
      }

      const data = doc.data();
      if (data?.tenantId !== tenantId || data?.userId !== uid) {
        throw new AppError('Notification not found', 'NOT_FOUND', 404);
      }

      await notifRef.update({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      });

      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (e: any) {
      const statusCode = e instanceof AppError ? e.statusCode : 500;
      res.status(statusCode).json({ success: false, message: e.message });
    }
  }
}
