interface GuestRecord {
  guestId: string;
  createdAt: Date;
  lastSeenAt: Date;
}

// In-memory for now — swapped for Postgres in Phase 3
const guests = new Map<string, GuestRecord>();

export class AuthRepository {
  async createGuest(guestId: string): Promise<GuestRecord> {
    const record: GuestRecord = {
      guestId,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    };
    guests.set(guestId, record);
    return record;
  }

  async findGuest(guestId: string): Promise<GuestRecord | null> {
    return guests.get(guestId) ?? null;
  }

  async touchGuest(guestId: string): Promise<void> {
    const record = guests.get(guestId);
    if (record) record.lastSeenAt = new Date();
  }
}