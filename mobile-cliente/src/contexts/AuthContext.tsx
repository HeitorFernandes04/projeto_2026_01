import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  nome: string;
  telefone: string;
  membro_desde?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('lm_access_token');
    const savedUser = localStorage.getItem('lm_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('lm_access_token');
        localStorage.removeItem('lm_user');
      }
    }
  }, []);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('lm_access_token', accessToken);
    localStorage.setItem('lm_refresh_token', refreshToken);
    localStorage.setItem('lm_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('lm_access_token');
    localStorage.removeItem('lm_refresh_token');
    localStorage.removeItem('lm_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
