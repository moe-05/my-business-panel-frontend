import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { HrDutiesType } from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const dutiesTypeApi = {
  async listByTenant(tenantId: string): Promise<HrDutiesType[]> {
    const response = await fetch(
      `${url}/duties-type?tenant_id=${encodeURIComponent(tenantId)}`,
      { method: "GET", credentials: "include" },
    );
    if (!response.ok) await buildError(response, "Error al cargar tipos de cargo");
    const json: ApiResponse<HrDutiesType[]> = await response.json();
    return json.data ?? [];
  },

  async create(data: {
    tenant_id: string;
    name: string;
    description?: string;
  }): Promise<HrDutiesType> {
    const response = await fetch(`${url}/duties-type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) await buildError(response, "Error al crear tipo de cargo");
    const json: ApiResponse<{ dutiesType: HrDutiesType }> = await response.json();
    return json.data.dutiesType;
  },

  async update(
    id: number,
    data: { name?: string; description?: string },
  ): Promise<void> {
    const response = await fetch(`${url}/duties-type/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) await buildError(response, "Error al actualizar tipo de cargo");
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${url}/duties-type/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) await buildError(response, "Error al eliminar tipo de cargo");
  },
};
