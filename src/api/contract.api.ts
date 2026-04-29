import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { UpdateContractPayload } from "@/interfaces/entities/Employee.interface";
import type { HrPaymentSchedule } from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const contractApi = {
  async getPaymentSchedules(): Promise<HrPaymentSchedule[]> {
    const response = await fetch(`${url}/contract/schedules`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar jornadas de pago");
    }

    const json: ApiResponse<HrPaymentSchedule[]> = await response.json();
    return json.data ?? [];
  },

  async update(contractId: string, data: UpdateContractPayload): Promise<void> {
    const response = await fetch(`${url}/contract/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await buildError(response, "Error al actualizar contrato");
    }
  },
};
