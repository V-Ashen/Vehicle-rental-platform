import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class AdminSettingsController {
  async getSettings(req: Request, res: Response) {
    const doc = await db.collection('systemSettings').doc('notifications').get();
    let data = doc.exists ? doc.data() : { subscriptionAlertsEnabled: true };
    res.status(200).json({ success: true, data });
  }

  async updateSettings(req: Request, res: Response) {
    const { subscriptionAlertsEnabled } = req.body;
    await db.collection('systemSettings').doc('notifications').set({
      subscriptionAlertsEnabled: subscriptionAlertsEnabled !== false,
      updatedAt: new Date(),
      updatedBy: (req as any).user?.uid || 'ADMIN'
    }, { merge: true });

    res.status(200).json({ success: true, message: 'Settings updated' });
  }
}
