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

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Email is required', 'VALIDATION_ERROR', 400);
    }

    // Process asynchronously, always return success immediately 
    // to prevent email enumeration attacks
    authService.forgotPassword(email).catch(err => {
      console.error('Background forgot password error:', err);
    });

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    });
  }
}
