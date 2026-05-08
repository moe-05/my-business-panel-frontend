import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { HrTardinessSummary } from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const tardinessApi = {
  async getByBranch(branchId: string): Promise<HrTardinessSummary> {
    const response = await fetch(`${url}/tardiness/branch/${branchId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar tardanzas");
    }

    const json: ApiResponse<HrTardinessSummary> = await response.json();
    return json.data;
  },

  async getByEmployee(employeeId: string): Promise<HrTardinessSummary> {
    const response = await fetch(`${url}/tardiness/employee/${employeeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar tardanzas del empleado");
    }

    const json: ApiResponse<HrTardinessSummary> = await response.json();
    return json.data;
  },

  async getByPeriod(
    start: string,
    end: string,
    branchId: string,
  ): Promise<HrTardinessSummary> {
    const response = await fetch(
      `${url}/tardiness/period?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&branchId=${encodeURIComponent(branchId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      await buildError(response, "Error al cargar tardanzas del periodo");
    }

    const json: ApiResponse<HrTardinessSummary> = await response.json();
    return json.data;
  },
};
