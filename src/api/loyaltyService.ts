import api from "./api";
import type {
  ILoyaltyProgram,
  ICreateLoyaltyProgramRequest,
  IUpdateLoyaltyProgramRequest,
} from "./types/auth";

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export const loyaltyService = {
  async getByTenant(tenantId: string): Promise<ILoyaltyProgram[]> {
    const res = await api.get<ApiResponse<ILoyaltyProgram[]>>(
      `/loyal-program/${tenantId}`,
    );
    return res.data.data;
  },

  async create(
    data: ICreateLoyaltyProgramRequest,
  ): Promise<{ message: string }> {
    const res = await api.post<ApiResponse<{ message: string }>>(
      "/loyal-program",
      data,
    );
    return res.data.data;
  },

  async update(
    programId: string,
    data: IUpdateLoyaltyProgramRequest,
  ): Promise<{ message: string }> {
    const res = await api.patch<ApiResponse<{ message: string }>>(
      `/loyal-program/${programId}`,
      data,
    );
    return res.data.data;
  },

  async delete(programId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/loyal-program/${programId}`,
    );
    return res.data.data;
  },
};
