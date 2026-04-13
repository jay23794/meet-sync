import { useState, useCallback, useEffect } from 'react';
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

// ─── Module-level shared store ────────────────────────────────────────────────
// Multiple components (App, AuthPage) call useAuth() independently. Without
// this, each instance holds its own React state and they fall out of sync when
// one of them calls join() or logout(). By broadcasting every change to all
// subscribers, every hook instance stays in lockstep.

let _session: GuestSession | null = loadSession();
const _subscribers = new Set<(s: GuestSession | null) => void>();

function broadcast(s: GuestSession | null) {
  _session = s;
  _subscribers.forEach(fn => fn(s));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [session, setSession] = useState<GuestSession | null>(() => _session);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register this instance so it receives broadcasts from other instances
  useEffect(() => {
    _subscribers.add(setSession);
    return () => { _subscribers.delete(setSession); };
  }, []);

  const join = useCallback(async (name?: string, avatar?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await createGuest(name, avatar);
      const s = toSession(data);
      persistSession(s);
      broadcast(s); // update every hook instance, not just this one
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
      broadcast(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const logout = useCallback(() => {
    clearSession();
    broadcast(null); // update every hook instance
    setError(null);
  }, []);

  return { session, isLoading, error, join, refresh, logout };
}
