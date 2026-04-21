import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { IEmployeeDetail, UpdateEmployeePayload } from "@/interfaces/entities/Employee.interface";

export const employeeApi = {
  async getByUserId(userId: string): Promise<IEmployeeDetail | null> {
    try {
      const response = await fetch(`${url}/employee/user/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) return null;

      const json: ApiResponse<IEmployeeDetail | null> = await response.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  },

  async update(employeeId: string, data: UpdateEmployeePayload): Promise<void> {
    const response = await fetch(`${url}/employee/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const message = json?.message ?? "Error al actualizar empleado";
      throw new Error(Array.isArray(message) ? message.join(", ") : message);
    }
  },
};
