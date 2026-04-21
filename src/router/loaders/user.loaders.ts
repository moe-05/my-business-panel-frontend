import { userApi } from "@/api/user.api";
import { authApi } from "@/api/auth.api";

import type { User } from "@/interfaces/entities/User.interface";
import type { Role } from "@/interfaces/entities/Role.interface";
import type { UsersListResponse } from "@/interfaces/api/responses/UsersListResponse.interface";

export type UsersPageLoaderData = {
  initialUsers: UsersListResponse;
};

export const getUsersPageData = async (): Promise<UsersPageLoaderData> => {
  const currentUser = await authApi.getCurrentUser();
  const tenantId = currentUser?.tenant?.tenant_id;
  const initialUsers = tenantId
    ? await userApi.listByTenant(tenantId)
    : { users: [], total: 0, page: 1, limit: 20 };

  return { initialUsers };
};

export const getUsers = async (
  tenantId?: string,
  page = 1,
  limit = 20,
): Promise<UsersListResponse> => userApi.list(tenantId, page, limit);

export const getUsersByTenant = async (
  tenantId: string,
  page = 1,
  limit = 20,
): Promise<UsersListResponse> => userApi.listByTenant(tenantId, page, limit);

export const getUserById = async (userId: string, full?: boolean): Promise<User> =>
  userApi.getById(userId, full);

export const getRoles = async (): Promise<Role[]> => userApi.getRoles();

export const searchUsers = async (
  query: string,
  tenantId?: string,
  page = 1,
  limit = 20,
): Promise<UsersListResponse> => userApi.search(query, tenantId, page, limit);
