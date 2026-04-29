import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrClockInPayload,
  HrClockingRecord,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const clockingApi = {
  async listByBranch(branchId: string): Promise<HrClockingRecord[]> {
    const response = await fetch(`${url}/clocking/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar marcajes");
    }

    const json: ApiResponse<HrClockingRecord[]> = await response.json();
    return json.data ?? [];
  },

  async listByEmployee(employeeId: string): Promise<HrClockingRecord[]> {
    const response = await fetch(`${url}/clocking/employee/${employeeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar marcajes del empleado");
    }

    const json: ApiResponse<HrClockingRecord[]> = await response.json();
    return json.data ?? [];
  },

  async clockIn(data: CreateHrClockInPayload): Promise<{ message: string }> {
    const response = await fetch(`${url}/clocking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al registrar clock in");
    }

    const json: ApiResponse<{ message: string }> = await response.json();
    return json.data;
  },

  async clockOut(employeeId: string): Promise<{ message: string }> {
    const response = await fetch(`${url}/clocking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ employeeId }),
    });

    if (!response.ok) {
      await buildError(response, "Error al registrar clock out");
    }

    const json: ApiResponse<{ message: string }> = await response.json();
    return json.data;
  },
};
