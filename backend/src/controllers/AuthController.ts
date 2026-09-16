import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../utils/AppError';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 'UNAUTHORIZED', 401);
    }
    const token = authHeader.split('Bearer ')[1];

    const { businessName, name, email, phone, address, city } = req.body;

    const result = await authService.register(token, businessName, name, email, phone, address, city);

    res.status(201).json({
      success: true,
      data: result
    });
  }

  async login(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 'UNAUTHORIZED', 401);
    }
    const token = authHeader.split('Bearer ')[1];

    const result = await authService.login(token);

    res.status(200).json({
      success: true,
      data: result
    });
  }

  async googleLogin(req: Request, res: Response) {
    const { firebaseToken } = req.body;
    const result = await authService.googleLogin(firebaseToken);

    res.status(200).json({
      success: true,
      data: result
    });
  }
}
