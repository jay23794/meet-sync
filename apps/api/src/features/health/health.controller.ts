import type { Request, Response } from 'express';
import { getHealth } from './health.service';
import type { ApiResponse } from '@videochat/shared';
import type { HealthData } from './health.service';

export function healthCheck(_req: Request, res: Response): void {
  const body: ApiResponse<HealthData> = { success: true, data: getHealth() };
  res.json(body);
}
