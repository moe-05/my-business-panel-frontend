import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  IEmployeeDetail,
  UpdateEmployeePayload,
} from "@/interfaces/entities/Employee.interface";
import type { HrEmployeeRecord } from "@/interfaces/entities/Hr.interface";

const buildError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  throw new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const employeeApi = {
  async listByTenant(tenantId: string): Promise<HrEmployeeRecord[]> {
    const response = await fetch(`${url}/employee/${tenantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al cargar empleados");
    }

    const json: ApiResponse<HrEmployeeRecord[]> = await response.json();
    return json.data ?? [];
  },

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
      await buildError(response, "Error al actualizar empleado");
    }
  },

  async checkAvailability(params: {
    field: "doc_number" | "email" | "phone";
    value: string;
    tenantId?: string;
    excludeId?: string;
  }): Promise<{ exists: boolean }> {
    const search = new URLSearchParams({
      field: params.field,
      value: params.value,
    });
    if (params.tenantId) search.set("tenant_id", params.tenantId);
    if (params.excludeId) search.set("exclude_id", params.excludeId);

    const response = await fetch(
      `${url}/employee/availability?${search.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) return { exists: false };

    const json: ApiResponse<{ exists: boolean }> = await response.json();
    return json.data ?? { exists: false };
  },

  async deactivate(employeeId: string): Promise<void> {
    const response = await fetch(`${url}/employee/deactivate/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      await buildError(response, "Error al desactivar empleado");
    }
  },
};
