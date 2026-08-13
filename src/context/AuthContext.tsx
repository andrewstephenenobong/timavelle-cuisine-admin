import { useState, type ReactNode } from 'react';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));

  function login(newToken: string) {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
