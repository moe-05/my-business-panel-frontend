import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrIncapacityPayload,
  HrIncapacity,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const incapacityApi = {
  async getByBranch(branchId: string): Promise<HrIncapacity[]> {
    const response = await fetch(`${url}/incapacity/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar incapacidades");
    }

    const json: ApiResponse<HrIncapacity[]> = await response.json();
    return json.data ?? [];
  },

  async create(data: CreateHrIncapacityPayload): Promise<{ id: number }> {
    const response = await fetch(`${url}/incapacity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al registrar incapacidad");
    }

    const json: ApiResponse<{ id: number }> = await response.json();
    return json.data;
  },

  async close(incapacityId: number): Promise<void> {
    const response = await fetch(`${url}/incapacity/${incapacityId}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cerrar incapacidad");
    }
  },
};
