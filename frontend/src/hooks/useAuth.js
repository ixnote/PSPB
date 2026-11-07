import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pspba_token';
const USER_KEY = 'pspba_user';

export function useAuth() {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const setToken = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem(STORAGE_KEY, newToken);
      if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setTokenState(newToken);
      setUser(newUser || null);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => setToken(null), [setToken]);

  return { token, user, setToken, logout, loading, setLoading };
}

export function getAuthHeaders() {
  const token = localStorage.getItem(STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
