import 'dotenv/config';
import http from 'node:http';
import app from './app';
import { connectMongo, disconnectMongo } from './db/mongo';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

connectMongo()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[api] http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[api] failed to connect to MongoDB:', err);
    process.exit(1);
  });

function shutdown(signal: string): void {
  console.log(`[api] ${signal} received — shutting down gracefully`);
  server.close(async (err) => {
    if (err) {
      console.error('[api] error during shutdown', err);
      process.exit(1);
    }
    await disconnectMongo();
    console.log('[api] server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
