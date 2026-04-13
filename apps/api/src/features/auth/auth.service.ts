import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { GuestTokenPayload, GuestAuthResponse } from '@videochat/shared';
import { AuthRepository } from './auth.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRY  = '7d';

function defaultName(guestId: string): string {
  // e.g. "Guest_a1b2c3d4" — readable but unique enough for a guest
  return `Guest_${guestId.slice(-8)}`;
}

function defaultAvatar(): string {
  // A random seed string; the frontend can feed this into any avatar API
  // e.g. https://api.dicebear.com/7.x/adventurer/svg?seed=<avatar>
  return randomUUID().replace(/-/g, '').slice(0, 16);
}

export class AuthService {
  private repo = new AuthRepository();

  async createGuestToken(name?: string, avatar?: string): Promise<GuestAuthResponse> {
    const guestId = `guest_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const resolvedName   = name   || defaultName(guestId);
    const resolvedAvatar = avatar || defaultAvatar();

    const record = await this.repo.createGuest(guestId, resolvedName, resolvedAvatar);

    const payload: GuestTokenPayload = { guestId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return { token, guestId, name: record.name, avatar: record.avatar };
  }

  verifyToken(token: string): GuestTokenPayload {
    return jwt.verify(token, JWT_SECRET) as GuestTokenPayload;
  }

  async refreshGuestToken(guestId: string): Promise<GuestAuthResponse> {
    const existing = await this.repo.findGuest(guestId);

    let record;
    if (!existing) {
      // Guest was deleted or never existed — recreate with generated defaults
      record = await this.repo.createGuest(guestId, defaultName(guestId), defaultAvatar());
    } else {
      await this.repo.touchGuest(guestId);
      record = existing;
    }

    const payload: GuestTokenPayload = { guestId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return { token, guestId, name: record.name, avatar: record.avatar };
  }
}
