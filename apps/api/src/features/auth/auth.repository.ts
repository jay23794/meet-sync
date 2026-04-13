import { GuestUser, IGuestUser } from './auth.model';

export interface GuestRecord {
  guestId: string;
  name: string;
  avatar: string;
  createdAt: Date;
  lastSeenAt: Date;
}

export class AuthRepository {
  async createGuest(guestId: string, name: string, avatar: string): Promise<GuestRecord> {
    const doc = await GuestUser.create({ guestId, name, avatar });
    return this.toRecord(doc);
  }

  async findGuest(guestId: string): Promise<GuestRecord | null> {
    const doc = await GuestUser.findOne({ guestId });
    return doc ? this.toRecord(doc) : null;
  }

  async touchGuest(guestId: string): Promise<void> {
    await GuestUser.updateOne({ guestId }, { lastSeenAt: new Date() });
  }

  /** Update profile fields (name, avatar) without changing guestId or timestamps */
  async updateGuest(
    guestId: string,
    updates: Partial<Pick<GuestRecord, 'name' | 'avatar'>>,
  ): Promise<GuestRecord | null> {
    const doc = await GuestUser.findOneAndUpdate(
      { guestId },
      { ...updates, lastSeenAt: new Date() },
      { new: true },
    );
    return doc ? this.toRecord(doc) : null;
  }

  private toRecord(doc: IGuestUser): GuestRecord {
    return {
      guestId:     doc.guestId,
      name:        doc.name,
      avatar:      doc.avatar,
      createdAt:   doc.createdAt,
      lastSeenAt:  doc.lastSeenAt,
    };
  }
}
