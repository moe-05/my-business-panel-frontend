import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { HaciendaConfigUpdate } from "@/interfaces/api/requests/HaciendaConfigUpdate.interface";
import type { HaciendaConfigStatus } from "@/interfaces/api/responses/HaciendaConfigStatus.interface";

export const haciendaApi = {
  async getStatus(tenantId: string): Promise<HaciendaConfigStatus> {
    try {
      const response = await fetch(
        `${url}/tenant-hacienda-config/${tenantId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<HaciendaConfigStatus> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener configuración de Hacienda",
      );
    }
  },

  async save(
    data: HaciendaConfigUpdate,
  ): Promise<{ tenant_hacienda_config_id: string }> {
    try {
      const response = await fetch(`${url}/tenant-hacienda-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ tenant_hacienda_config_id: string }> =
        await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al guardar configuración de Hacienda",
      );
    }
  },

  async deactivate(tenantId: string): Promise<{ deactivated: boolean }> {
    try {
      const response = await fetch(
        `${url}/tenant-hacienda-config/${tenantId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<{ deactivated: boolean }> =
        await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al desactivar configuración de Hacienda",
      );
    }
  },
};
