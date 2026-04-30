import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrFoulPayload,
  HrFoulRecord,
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

  async getByEmployee(employeeId: string): Promise<HrFoulSummary> {
    const response = await fetch(`${url}/foul/employee/${employeeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar faltas del empleado");
    }

    const json: ApiResponse<HrFoulSummary> = await response.json();
    return json.data;
  },

  async getByPeriod(start: string, end: string): Promise<HrFoulRecord[]> {
    const response = await fetch(
      `${url}/foul/period?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      await buildError(response, "Error al cargar faltas del periodo");
    }

    const json: ApiResponse<HrFoulRecord[]> = await response.json();
    return Array.isArray(json.data) ? json.data : [];
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
