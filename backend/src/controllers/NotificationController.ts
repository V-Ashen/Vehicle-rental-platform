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

      const queryUser = db.collection('notifications')
        .where('tenantId', '==', tenantId)
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50);

      const queryAdmin = db.collection('notifications')
        .where('tenantId', '==', tenantId)
        .where('userId', '==', 'TENANT_ADMIN')
        .orderBy('createdAt', 'desc')
        .limit(50);

      const [snapUser, snapAdmin] = await Promise.all([queryUser.get(), queryAdmin.get()]);
      
      const allDocs = [...snapUser.docs, ...snapAdmin.docs];
      let notifications = allDocs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      notifications.sort((a, b) => {
        const timeA = a.createdAt?._seconds || 0;
        const timeB = b.createdAt?._seconds || 0;
        return timeB - timeA;
      });

      if (isReadParam !== undefined) {
        const isRead = isReadParam === 'true';
        notifications = notifications.filter(n => (n.isRead === true) === isRead);
      }

      notifications = notifications.slice(0, 50);

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

      const notifRef = db.collection('notifications').doc(id as string);
      const doc = await notifRef.get();

      if (!doc.exists) {
        throw new AppError('Notification not found', 'NOT_FOUND', 404);
      }

      const data = doc.data();
      if (data?.tenantId !== tenantId || (data?.userId !== uid && data?.userId !== 'TENANT_ADMIN')) {
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
