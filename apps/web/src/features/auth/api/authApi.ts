import type { GuestAuthResponse } from '@videochat/shared';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';

export async function createGuest(name?: string, avatar?: string): Promise<GuestAuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(name   ? { name }   : {}),
      ...(avatar ? { avatar } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  return json.data as GuestAuthResponse;
}

export async function refreshToken(token: string): Promise<GuestAuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  return json.data as GuestAuthResponse;
}
