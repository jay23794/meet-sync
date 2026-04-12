import { Request, Response } from 'express';
import { ApiResponse, GuestAuthResponse } from '@videochat/shared';
import { AuthService } from './auth.service';

export class AuthController {
  private service = new AuthService();

  // POST /api/auth/guest
  createGuest = async (_req: Request, res: Response) => {
    const result = await this.service.createGuestToken();
    const body: ApiResponse<GuestAuthResponse> = { success: true, data: result };
    res.status(201).json(body);
  };

  // POST /api/auth/refresh
  refresh = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.slice(7);

    let guestId: string;
    try {
      const payload = this.service.verifyToken(token);
      guestId = payload.guestId;
    } catch {
      // expired or invalid — just create a fresh guest
      const result = await this.service.createGuestToken();
      return res.json({ success: true, data: result });
    }

    const result = await this.service.refreshGuestToken(guestId);
    res.json({ success: true, data: result });
  };
}