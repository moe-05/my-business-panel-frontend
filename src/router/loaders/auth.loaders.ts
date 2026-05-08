import { authApi } from "@/api/auth.api";

import type { CurrentUserResponse } from "@/interfaces/api/responses/CurrentUserResponse.interface";

export const getCurrentUser = async (): Promise<CurrentUserResponse> =>
  authApi.getCurrentUser();
