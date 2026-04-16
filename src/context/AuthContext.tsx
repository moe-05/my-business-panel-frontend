/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authService } from "../api/authService";
import type { ICurrentUser, ILoginRequest } from "../api/types/auth";

interface AuthContextValue {
  user: ICurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: ILoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "mbp_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ICurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ICurrentUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (u: ICurrentUser | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  // Verifica la sesión al montar (cookie puede seguir válida)
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      persistUser(currentUser);
    } catch {
      persistUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (data: ILoginRequest) => {
    await authService.login(data);
    const currentUser = await authService.getCurrentUser();
    persistUser(currentUser);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      persistUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
