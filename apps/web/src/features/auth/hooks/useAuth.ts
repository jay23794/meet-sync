import { useState, useCallback } from 'react';
import { createGuest, refreshToken } from '../api/authApi';
import type { GuestSession } from '../types';

const STORAGE_KEY = 'vc_guest_session';

function loadSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}

function persistSession(s: GuestSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function toSession(data: { token: string; guestId: string; name: string; avatar: string }): GuestSession {
  return { token: data.token, guestId: data.guestId, name: data.name, avatar: data.avatar };
}

export function useAuth() {
  const [session, setSession] = useState<GuestSession | null>(loadSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (name?: string, avatar?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createGuest(name, avatar);
      const s = toSession(data);
      persistSession(s);
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await refreshToken(session.token);
      const s = toSession(data);
      persistSession(s);
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setError(null);
  }, []);

  return { session, isLoading, error, join, refresh, logout };
}
