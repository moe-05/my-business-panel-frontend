import api from "./api";
import type { ILoginRequest, ILoginResponse, ICurrentUser } from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ILoginHistory {
  login_id: string;
  user_id: string;
  login_time: string;
  logout_time?: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
}

export const authService = {
  async login(data: ILoginRequest): Promise<ILoginResponse> {
    const res = await api.post<ILoginResponse>("/auth/login", data);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getCurrentUser(): Promise<ICurrentUser> {
    const res = await api.get<ApiResponse<ICurrentUser>>("/user");
    return res.data.data;
  },

  async changePassword(
    data: IChangePasswordRequest,
  ): Promise<{ message: string }> {
    const res = await api.post<ApiResponse<{ message: string }>>(
      "/auth/change-password",
      {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      },
    );
    return res.data.data;
  },

  async getLoginHistory(): Promise<ILoginHistory[]> {
    const res = await api.get<ApiResponse<ILoginHistory[]>>(
      "/auth/login-history",
    );
    return res.data.data;
  },
};
