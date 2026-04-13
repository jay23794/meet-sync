import { Schema, model, Document } from 'mongoose';

export interface IGuestUser extends Document {
  guestId: string;
  name: string;
  avatar: string;
  createdAt: Date;
  lastSeenAt: Date;
}

const guestUserSchema = new Schema<IGuestUser>(
  {
    guestId:     { type: String, required: true, unique: true, index: true },
    name:        { type: String, required: true },
    avatar:      { type: String, required: true },
    lastSeenAt:  { type: Date, default: () => new Date() },
  },
  {
    // Automatically manages createdAt; updatedAt is tracked manually via lastSeenAt
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const GuestUser = model<IGuestUser>('GuestUser', guestUserSchema);
