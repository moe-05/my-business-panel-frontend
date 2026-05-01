import api from "./api";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { Currency } from "@/interfaces/entities/Currency.interface";

export const currencyApi = {
  async getAll(): Promise<Currency[]> {
    const response = await api.get<ApiResponse<Currency[]>>("/currency");
    return response.data.data;
  },

  async getById(id: number): Promise<Currency | null> {
    const response = await api.get<ApiResponse<Currency | null>>(
      `/currency/${id}`,
    );
    return response.data.data;
  },
};
