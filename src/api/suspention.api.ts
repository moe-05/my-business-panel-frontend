import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrSuspentionPayload,
  HrSuspention,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const suspentionApi = {
  async getByBranch(branchId: string): Promise<HrSuspention[]> {
    const response = await fetch(`${url}/suspention/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar suspensiones");
    }

    const json: ApiResponse<HrSuspention[] | { message: string }> =
      await response.json();
    return Array.isArray(json.data) ? json.data : [];
  },

  async create(
    data: CreateHrSuspentionPayload,
  ): Promise<{ suspentionId: number }> {
    const response = await fetch(`${url}/suspention`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al registrar suspensión");
    }

    const json: ApiResponse<{ suspentionId: number }> = await response.json();
    return json.data;
  },

  async close(suspentionId: number): Promise<void> {
    const response = await fetch(`${url}/suspention/${suspentionId}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cerrar suspensión");
    }
  },
};
