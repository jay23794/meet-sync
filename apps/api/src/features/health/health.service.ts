export interface HealthData {
  status: string;
  uptime: number;
}

export function getHealth(): HealthData {
  return { status: 'ok', uptime: process.uptime() };
}
