import api from "./api";
import type {
  INewBranchRequest,
  IBranchResponse,
  IUpdateBranchRequest,
  IBranchListResponse,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const branchService = {
  async create(data: INewBranchRequest): Promise<IBranchResponse> {
    const res = await api.post<ApiResponse<IBranchResponse>>("/branch", data);
    return res.data.data;
  },

  // Lists branches: superusers get all, regular users get their tenant's
  async list(page = 1, limit = 100): Promise<IBranchListResponse> {
    const res = await api.get<ApiResponse<IBranchListResponse>>("/branch", {
      params: { page, limit },
    });
    return res.data.data;
  },

  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<IBranchListResponse> {
    const res = await api.get<ApiResponse<IBranchListResponse>>(
      `/branch/tenant/${tenantId}`,
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  async getById(branchId: string): Promise<IBranchResponse> {
    const res = await api.get<ApiResponse<IBranchResponse>>(
      `/branch/${branchId}`,
    );
    return res.data.data;
  },

  async update(
    branchId: string,
    data: IUpdateBranchRequest,
  ): Promise<IBranchResponse> {
    const res = await api.patch<ApiResponse<IBranchResponse>>(
      `/branch/${branchId}`,
      data,
    );
    return res.data.data;
  },

  async delete(branchId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/branch/${branchId}`,
    );
    return res.data.data;
  },
};
