import api from "./api";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateExchangeRatePayload,
  ExchangeRate,
  UpdateExchangeRatePayload,
} from "@/interfaces/entities/ExchangeRate.interface";

export const exchangeRateApi = {
  async getAll(): Promise<ExchangeRate[]> {
    const response = await api.get<ApiResponse<ExchangeRate[]>>(
      "/exchange-rate",
    );
    return response.data.data;
  },

  async getLatest(
    fromCurrencyId: number,
    toCurrencyId: number,
  ): Promise<ExchangeRate | null> {
    const response = await api.get<ApiResponse<ExchangeRate | null>>(
      `/exchange-rate/latest`,
      {
        params: {
          from_currency_id: fromCurrencyId,
          to_currency_id: toCurrencyId,
        },
      },
    );
    return response.data.data;
  },

  async create(payload: CreateExchangeRatePayload): Promise<ExchangeRate> {
    const response = await api.post<ApiResponse<ExchangeRate>>(
      "/exchange-rate",
      payload,
    );
    return response.data.data;
  },

  async update(
    id: string,
    payload: UpdateExchangeRatePayload,
  ): Promise<ExchangeRate> {
    const response = await api.patch<ApiResponse<ExchangeRate>>(
      `/exchange-rate/${id}`,
      payload,
    );
    return response.data.data;
  },

  async delete(id: string): Promise<{ exchange_rate_id: string }> {
    const response = await api.delete<
      ApiResponse<{ exchange_rate_id: string }>
    >(`/exchange-rate/${id}`);
    return response.data.data;
  },
};
