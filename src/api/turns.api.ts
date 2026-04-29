import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrTurnPayload,
  HrTurn,
  UpdateHrTurnPayload,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const turnsApi = {
  async listByBranch(branchId: string): Promise<HrTurn[]> {
    const response = await fetch(`${url}/turns/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar turnos");
    }

    const json: ApiResponse<HrTurn[]> = await response.json();
    return json.data ?? [];
  },

  async create(data: CreateHrTurnPayload): Promise<{ turnId: number }> {
    const response = await fetch(`${url}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al crear turno");
    }

    const json: ApiResponse<{ turnId: number }> = await response.json();
    return json.data;
  },

  async update(
    turnId: number,
    data: UpdateHrTurnPayload,
  ): Promise<{ turnId: number }> {
    const response = await fetch(`${url}/turns/${turnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al actualizar turno");
    }

    const json: ApiResponse<{ turnId: number }> = await response.json();
    return json.data;
  },

  async delete(turnId: number): Promise<{ turnId: number }> {
    const response = await fetch(`${url}/turns/${turnId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al eliminar turno");
    }

    const json: ApiResponse<{ turnId: number }> = await response.json();
    return json.data;
  },
};
