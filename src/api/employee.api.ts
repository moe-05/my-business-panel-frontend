import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  IEmployeeDetail,
  UpdateEmployeePayload,
} from "@/interfaces/entities/Employee.interface";
import type { HrEmployeeRecord } from "@/interfaces/entities/Hr.interface";

export interface CreateEmployeeWithContractPayload {
  tenant_id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  doc_number: string;
  identification_type_id: number;
  phone: string;
  email: string;
  payment_schedule_id: number;
  contractData: {
    start_date: string;
    end_date: string;
    hours: number;
    base_salary: number;
    duties_type_id?: number | null;
    turn_type: number;
    turn_id: number;
  };
}

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

  async createWithContract(
    data: CreateEmployeeWithContractPayload,
  ): Promise<void> {
    const response = await fetch(`${url}/employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await buildError(response, "Error al crear empleado");
    }
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
