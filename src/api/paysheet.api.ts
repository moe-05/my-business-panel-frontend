import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  HrPaysheet,
  HrPaysheetDetail,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const paysheetApi = {
  async listByTenant(tenantId: string): Promise<HrPaysheet[]> {
    const response = await fetch(`${url}/paysheet/tenant/${tenantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar nóminas");
    }

    const json: ApiResponse<HrPaysheet[]> = await response.json();
    return json.data ?? [];
  },

  async listByBranch(branchId: string): Promise<HrPaysheet[]> {
    const response = await fetch(`${url}/paysheet/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar nóminas por sucursal");
    }

    const json: ApiResponse<HrPaysheet[]> = await response.json();
    return json.data ?? [];
  },

  async getDetails(paysheetId: string): Promise<HrPaysheetDetail[]> {
    const response = await fetch(`${url}/paysheet/${paysheetId}/details`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar detalles de nómina");
    }

    const json: ApiResponse<HrPaysheetDetail[]> = await response.json();
    return json.data ?? [];
  },
};
