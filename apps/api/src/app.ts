import express from 'express';
import cors from 'cors';
import healthRouter from './features/health/health.router';
import authRouter from './features/auth/auth.routes';
import swaggerRouter from './docs/swagger.router';
import { errorHandler } from './middleware/errorHandler';
import type { ApiResponse } from '@videochat/shared';

const app = express();

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api-docs', swaggerRouter);

app.use((_req, res) => {
  const body: ApiResponse = { success: false, error: 'Not found' };
  res.status(404).json(body);
});

app.use(errorHandler);

export default app;
