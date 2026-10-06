import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api/client';

/**
 * AuthContext keeps the signed-in user in one place.
 *
 * On first load it calls /auth/me so a page refresh keeps the user signed in
 * (the session lives in an httpOnly cookie, not in localStorage).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" is true only during the initial session check, so pages do not
  // flash the login screen while we are still finding out who the user is.
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await api.me();
        if (active) setUser(data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // The AI status drives the "demo mode" banner, so fetch it once on load.
  useEffect(() => {
    let active = true;
    api
      .aiStatus()
      .then((data) => active && setAiStatus(data.ai))
      .catch(() => active && setAiStatus(null));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await api.register(details);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Clear locally even if the network call failed, so the UI stays correct.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, aiStatus, login, register, logout }),
    [user, loading, aiStatus, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}
