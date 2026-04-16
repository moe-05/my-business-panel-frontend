import api from "./api";
import type {
  ICreateUserRequest,
  ICreateUserResponse,
  IUser,
  IUsersListResponse,
  IUpdateUserRequest,
  IUserDetailResponse,
  IRole,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const userService = {
  // Create new user (onboarding)
  async create(data: ICreateUserRequest): Promise<ICreateUserResponse> {
    const res = await api.post<ApiResponse<ICreateUserResponse>>("/user", data);
    return res.data.data;
  },

  // Get users list (admin nivel 1 gets all, others get their tenant users)
  async list(
    tenantId?: string,
    page = 1,
    limit = 20,
  ): Promise<IUsersListResponse> {
    const params: Record<string, any> = { page, limit };
    if (tenantId) {
      params.tenant_id = tenantId;
    }
    const res = await api.get<ApiResponse<IUsersListResponse>>("/user", {
      params,
    });
    return res.data.data;
  },

  // Get users for specific tenant (for admin nivel 1 or tenant admin)
  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<IUsersListResponse> {
    const res = await api.get<ApiResponse<IUsersListResponse>>(
      `/tenant/${tenantId}/users`,
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  // Get user details by ID
  async getById(userId: string): Promise<IUserDetailResponse> {
    const res = await api.get<ApiResponse<IUserDetailResponse>>(
      `/user/${userId}`,
    );
    return res.data.data;
  },

  // Get user details by email
  async getByEmail(email: string): Promise<IUserDetailResponse> {
    const res = await api.get<ApiResponse<IUserDetailResponse>>(
      `/user/${email}`,
    );
    return res.data.data;
  },

  // Update user
  async update(userId: string, data: IUpdateUserRequest): Promise<IUser> {
    const res = await api.patch<ApiResponse<IUser>>(`/user/${userId}`, data);
    return res.data.data;
  },

  // Delete user
  async delete(userId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/user/${userId}`,
    );
    return res.data.data;
  },

  // Get available roles
  async getRoles(): Promise<IRole[]> {
    const res = await api.get<ApiResponse<IRole[]>>("/user/roles");
    return res.data.data;
  },

  // Search users (by email or name)
  async search(
    query: string,
    tenantId?: string,
    page = 1,
    limit = 20,
  ): Promise<IUsersListResponse> {
    const params: Record<string, any> = { q: query, page, limit };
    if (tenantId) {
      params.tenant_id = tenantId;
    }
    const res = await api.get<ApiResponse<IUsersListResponse>>("/user/search", {
      params,
    });
    return res.data.data;
  },
};
