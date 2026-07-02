import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredUser, saveSession, clearSession, resolveRedirect } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    if (!data.accessToken || !data.user) throw { message: 'Invalid response from server.' };
    saveSession(data.accessToken, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const data = await api.post('/api/auth/register', { ...form, role: 'customer' });
    saveSession(data.accessToken, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    setUser(null);
    api.post('/api/auth/logout').catch(() => {});
    navigate('/login');
  }, [navigate]);

  const goAfterLogin = useCallback((role, redirectParam) => {
    navigate(resolveRedirect(role, redirectParam));
  }, [navigate]);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      setLoading,
      login,
      register,
      logout,
      goAfterLogin,
      isLoggedIn: !!user && !!localStorage.getItem('mediflow_token'),
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
