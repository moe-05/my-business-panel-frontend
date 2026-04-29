import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { HrPayrollMovement } from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const payrollMovementApi = {
  async listByPaysheet(paysheetId: string): Promise<HrPayrollMovement[]> {
    const response = await fetch(`${url}/movements/paysheet/${paysheetId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar movimientos");
    }

    const json: ApiResponse<HrPayrollMovement[]> = await response.json();
    return json.data ?? [];
  },
};
