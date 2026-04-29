import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrFoulPayload,
  HrFoulSummary,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const foulApi = {
  async getByBranch(branchId: string): Promise<HrFoulSummary> {
    const response = await fetch(`${url}/foul/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar faltas");
    }

    const json: ApiResponse<HrFoulSummary> = await response.json();
    return json.data;
  },

  async create(data: CreateHrFoulPayload): Promise<{ foulId: number }> {
    const response = await fetch(`${url}/foul`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al registrar falta");
    }

    const json: ApiResponse<{ foulId: number }> = await response.json();
    return json.data;
  },
};
