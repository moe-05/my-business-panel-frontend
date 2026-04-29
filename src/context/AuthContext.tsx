/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth.api";
import { clockingApi } from "@/api/clocking.api";
import { employeeApi } from "@/api/employee.api";
import type { CurrentUserResponse } from "../interfaces/api/responses/CurrentUserResponse.interface";
import type { LoginRequest } from "../interfaces/api/requests/LoginRequest.interface";

interface AuthContextValue {
  user: CurrentUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const registerClockInForUser = async (userId: string) => {
  const employee = await employeeApi.getByUserId(userId);

  if (!employee) return;

  await clockingApi.clockIn({
    employeeId: employee.employee_id,
    branchId: employee.branch_id,
  });
};

const registerClockOutForUser = async (userId: string) => {
  const employee = await employeeApi.getByUserId(userId);

  if (!employee) return;

  await clockingApi.clockOut(employee.employee_id);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehidrata la sesión desde la cookie al montar el provider
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    const session = await authApi.login(data);
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);

    void registerClockInForUser(session.user.user_id).catch((error) => {
      console.error("No se pudo registrar el clock in automático", error);
    });
  };

  const logout = async () => {
    try {
      if (user?.user_id) {
        await registerClockOutForUser(user.user_id).catch((error) => {
          console.error("No se pudo registrar el clock out automático", error);
        });
      }

      await authApi.logout();
    } finally {
      setUser(null);
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
