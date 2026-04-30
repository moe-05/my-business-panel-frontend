import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";

export interface SpecialCodeRecord {
  special_code_id: string;
  code: string;
  description: string | null;
  is_used: boolean;
  tenant_id: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_by_email: string | null;
  used_by_tenant_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSpecialCodePayload {
  code: string;
  description?: string;
  expires_at?: string;
}

export type SpecialCodeValidationReason =
  | "not_found"
  | "already_used"
  | "expired";

export interface SpecialCodeValidation {
  valid: boolean;
  reason?: SpecialCodeValidationReason;
}

const safeError = async (response: Response, fallback: string) => {
  const json = await response.json().catch(() => ({}));
  const message = json?.message ?? json?.error ?? fallback;
  return new Error(Array.isArray(message) ? message.join(", ") : message);
};

export const specialCodeApi = {
  async listAll(): Promise<SpecialCodeRecord[]> {
    const response = await fetch(`${url}/special-code`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw await safeError(response, "Error al listar códigos especiales");
    }
    const json: ApiResponse<SpecialCodeRecord[]> = await response.json();
    return json.data ?? [];
  },

  async create(data: CreateSpecialCodePayload): Promise<SpecialCodeRecord> {
    const response = await fetch(`${url}/special-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw await safeError(response, "Error al crear código especial");
    }
    const json: ApiResponse<SpecialCodeRecord> = await response.json();
    return json.data;
  },

  async remove(specialCodeId: string): Promise<{ message: string }> {
    const response = await fetch(`${url}/special-code/${specialCodeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw await safeError(response, "Error al eliminar código especial");
    }
    const json: ApiResponse<{ message: string }> = await response.json();
    return json.data;
  },

  /**
   * Endpoint público (sin autenticación) que el onboarding usa para
   * decirle al usuario en línea si su código es válido. NO consume el
   * código — el canje atómico ocurre en la transacción de creación de
   * tenant.
   */
  async validate(code: string): Promise<SpecialCodeValidation> {
    const response = await fetch(
      `${url}/special-code/validate?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!response.ok) {
      // Si la verificación falla por red, devolvemos `valid: false` para
      // que el botón quede deshabilitado en el frontend.
      return { valid: false, reason: "not_found" };
    }
    const json: ApiResponse<SpecialCodeValidation> = await response.json();
    return json.data ?? { valid: false, reason: "not_found" };
  },
};
