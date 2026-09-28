import { Request, Response } from 'express';
import { AdminUsersService } from '../services/AdminUsersService';

const usersService = new AdminUsersService();

export class AdminUsersController {
  async list(req: Request, res: Response) {
    const result = await usersService.getAllSaaSUsers();
    res.status(200).json({ success: true, data: result });
  }

  async invite(req: Request, res: Response) {
    const userId = (req as any).adminUser?.id || 'SYSTEM';
    const result = await usersService.inviteSaaSUser(req.body, userId);
    res.status(201).json({ success: true, data: result });
  }
}
