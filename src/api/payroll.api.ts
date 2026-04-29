import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CreateHrPaysheetPayload,
  ProcessHrPayrollPayload,
} from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const payrollApi = {
  async createPaysheet(data: CreateHrPaysheetPayload): Promise<{
    paysheet_id: string;
  }> {
    const response = await fetch(`${url}/payroll/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al crear nómina");
    }

    const json: ApiResponse<{ paysheet_id: string }> = await response.json();
    return json.data;
  },

  async processPaysheet(
    paysheetId: string,
    data: ProcessHrPayrollPayload,
  ): Promise<{ paysheet_id?: string }> {
    const response = await fetch(`${url}/payroll/${paysheetId}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al procesar nómina");
    }

    const json: ApiResponse<{ paysheet_id?: string }> = await response.json();
    return json.data;
  },
};
