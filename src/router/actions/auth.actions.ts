import { authApi } from "@/api/auth.api";

import type { LoginRequest } from "@/interfaces/api/requests/LoginRequest.interface";
import type { ChangePasswordRequest } from "@/interfaces/api/requests/ChangePasswordRequest.interface";
import type { LoginResponse } from "@/interfaces/api/responses/LoginResponse.interface";

export const login = async (data: LoginRequest): Promise<LoginResponse> =>
  authApi.login(data);

export const logout = async (): Promise<void> => authApi.logout();

export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<{ message: string }> => authApi.changePassword(data);
