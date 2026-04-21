import { url } from ".";

import type { UpdateContractPayload } from "@/interfaces/entities/Employee.interface";

export const contractApi = {
  async update(contractId: string, data: UpdateContractPayload): Promise<void> {
    const response = await fetch(`${url}/contract/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const message = json?.message ?? "Error al actualizar contrato";
      throw new Error(Array.isArray(message) ? message.join(", ") : message);
    }
  },
};
