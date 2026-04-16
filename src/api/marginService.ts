import api from "./api";
import type {
  IMargin,
  ICreateMarginRequest,
  IMarginsListResponse,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const marginService = {
  // Get margins for a tenant
  async listByTenant(tenantId: string): Promise<IMargin[]> {
    const res = await api.get<ApiResponse<IMargin[]>>(`/margin/${tenantId}`);
    return res.data.data;
  },

  // Get margins list response
  async list(tenantId: string): Promise<IMarginsListResponse> {
    const res = await api.get<ApiResponse<IMarginsListResponse>>(
      `/margins/${tenantId}`,
    );
    return res.data.data;
  },

  // Create margin
  async create(data: ICreateMarginRequest): Promise<IMargin> {
    const res = await api.post<ApiResponse<IMargin>>("/margin", data);
    return res.data.data;
  },

  // Update margin
  async update(marginId: string, marginPercentage: number): Promise<IMargin> {
    const res = await api.patch<ApiResponse<IMargin>>(`/margin/${marginId}`, {
      margin_percentage: marginPercentage,
    });
    return res.data.data;
  },

  // Delete margin
  async delete(marginId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/margin/${marginId}`,
    );
    return res.data.data;
  },
};
