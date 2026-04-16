import api from "./api";
import type {
  INewTenantRequest,
  ITenantResponse,
  IUser,
  IUsersListResponse,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

interface ITenantListResponse {
  tenants: ITenantResponse[];
  total: number;
  page: number;
  limit: number;
}

export const tenantService = {
  async create(data: INewTenantRequest): Promise<ITenantResponse> {
    const res = await api.post<ApiResponse<ITenantResponse>>("/tenant", data);
    return res.data.data;
  },

  async getAll(page = 1, limit = 20): Promise<ITenantListResponse> {
    const res = await api.get<ApiResponse<ITenantListResponse>>("/tenant", {
      params: { page, limit },
    });
    return res.data.data;
  },

  async getById(tenantId: string): Promise<ITenantResponse> {
    const res = await api.get<ApiResponse<ITenantResponse>>(
      `/tenant/${tenantId}`,
    );
    return res.data.data;
  },

  async update(
    tenantId: string,
    data: Partial<INewTenantRequest>,
  ): Promise<ITenantResponse> {
    const res = await api.patch<ApiResponse<ITenantResponse>>(
      `/tenant/${tenantId}`,
      data,
    );
    return res.data.data;
  },

  async delete(tenantId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/tenant/${tenantId}`,
    );
    return res.data.data;
  },

  async getTenantUsers(
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

  async search(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<ITenantListResponse> {
    const res = await api.get<ApiResponse<ITenantListResponse>>(
      "/tenant/search",
      {
        params: { q: query, page, limit },
      },
    );
    return res.data.data;
  },
};
