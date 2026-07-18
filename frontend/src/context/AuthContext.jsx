import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cd_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cd_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('cd_token', newToken);
    localStorage.setItem('cd_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cd_token');
    localStorage.removeItem('cd_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
