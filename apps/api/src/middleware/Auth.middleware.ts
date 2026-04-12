import { Request, Response, NextFunction } from 'express';
import { GuestTokenPayload } from '@videochat/shared';
import { AuthService } from '../features/auth/auth.service';

// Adds req.guest to every protected route
declare global {
  namespace Express {
    interface Request {
      guest: GuestTokenPayload;
    }
  }
}

const authService = new AuthService();

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  try {
    req.guest = authService.verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}