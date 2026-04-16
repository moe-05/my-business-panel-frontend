import api from "./api";
import type {
  IHaciendaConfigStatus,
  IHaciendaConfigUpdate,
} from "./types/auth";

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export const haciendaService = {
  async getStatus(tenantId: string): Promise<IHaciendaConfigStatus> {
    const res = await api.get<ApiResponse<IHaciendaConfigStatus>>(
      `/tenant-hacienda-config/${tenantId}`,
    );
    return res.data.data;
  },

  async save(
    data: IHaciendaConfigUpdate,
  ): Promise<{ tenant_hacienda_config_id: string }> {
    const res = await api.post<
      ApiResponse<{ tenant_hacienda_config_id: string }>
    >("/tenant-hacienda-config", data);
    return res.data.data;
  },

  async deactivate(tenantId: string): Promise<{ deactivated: boolean }> {
    const res = await api.delete<ApiResponse<{ deactivated: boolean }>>(
      `/tenant-hacienda-config/${tenantId}`,
    );
    return res.data.data;
  },
};
