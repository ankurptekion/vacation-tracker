import { createContext, useContext, useState } from 'react';

export type Role = 'admin' | 'user';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, username: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  role: null,
  isAuthenticated: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]       = useState<string | null>(() => localStorage.getItem('vt_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('vt_username'));
  const [role, setRole]         = useState<Role | null>(() => (localStorage.getItem('vt_role') as Role | null) ?? null);

  const login = (newToken: string, newUsername: string, newRole: Role) => {
    localStorage.setItem('vt_token', newToken);
    localStorage.setItem('vt_username', newUsername);
    localStorage.setItem('vt_role', newRole);
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('vt_token');
    localStorage.removeItem('vt_username');
    localStorage.removeItem('vt_role');
    setToken(null);
    setUsername(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      token, username, role,
      isAuthenticated: !!token,
      isAdmin: role === 'admin',
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
