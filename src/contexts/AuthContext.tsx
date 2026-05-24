import { createContext, useContext, useState } from 'react';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vt_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('vt_username'));

  const login = (newToken: string, newUsername: string) => {
    localStorage.setItem('vt_token', newToken);
    localStorage.setItem('vt_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_username');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
