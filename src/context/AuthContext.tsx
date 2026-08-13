import { useEffect, useState, type ReactNode } from 'react';
import api from '../lib/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem('adminToken')));

  useEffect(() => {
    let active = true;
    const storedToken = localStorage.getItem('adminToken');
    const handleExpired = () => { if (active) setToken(null); };
    window.addEventListener('admin-auth-expired', handleExpired);
    if (!storedToken) {
      return () => window.removeEventListener('admin-auth-expired', handleExpired);
    }
    api.get('/api/auth/me')
      .catch(() => {
        localStorage.removeItem('adminToken');
        if (active) setToken(null);
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; window.removeEventListener('admin-auth-expired', handleExpired); };
  }, []);

  function login(newToken: string) {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setIsLoading(false);
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
