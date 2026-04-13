import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videochat';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('[mongo] connected to', MONGO_URI);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log('[mongo] disconnected');
}
