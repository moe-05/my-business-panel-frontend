import { authApi } from "@/api/auth.api";

import type { CurrentUserResponse } from "@/interfaces/api/responses/CurrentUserResponse.interface";
import type { LoginHistoryResponse } from "@/interfaces/api/responses/LoginHistoryResponse.interface";

export const getCurrentUser = async (): Promise<CurrentUserResponse> =>
  authApi.getCurrentUser();

export const getLoginHistory = async (): Promise<LoginHistoryResponse[]> =>
  authApi.getLoginHistory();
