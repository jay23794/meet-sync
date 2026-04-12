import 'dotenv/config';
import http from 'node:http';
import app from './app';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`[api] ${signal} received — shutting down gracefully`);
  server.close((err) => {
    if (err) {
      console.error('[api] error during shutdown', err);
      process.exit(1);
    }
    console.log('[api] server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
