import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { GuestTokenPayload, GuestAuthResponse } from '@videochat/shared';
import { AuthRepository } from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRY  = '7d';

export class AuthService {
  private repo = new AuthRepository();

  async createGuestToken(): Promise<GuestAuthResponse> {
    const guestId = `guest_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    await this.repo.createGuest(guestId);

    const payload: GuestTokenPayload = { guestId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return { token, guestId };
  }

  verifyToken(token: string): GuestTokenPayload {
    return jwt.verify(token, JWT_SECRET) as GuestTokenPayload;
  }

  async refreshGuestToken(guestId: string): Promise<GuestAuthResponse> {
    const existing = await this.repo.findGuest(guestId);

    if (!existing) {
      await this.repo.createGuest(guestId);
    } else {
      await this.repo.touchGuest(guestId);
    }

    const payload: GuestTokenPayload = { guestId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return { token, guestId };
  }
}