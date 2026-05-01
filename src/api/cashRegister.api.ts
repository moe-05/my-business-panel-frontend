import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  CashRegister,
  CashRegisterSession,
} from "@/interfaces/entities/CashRegister.interface";

interface ListWrapper<T> {
  results: T[];
}

interface SingleWrapper<T> {
  result: T;
}

export const cashRegisterApi = {
  async create(
    branchId: string,
    registerName: string,
    isActive = true,
    cashRegisterKey?: string | null,
  ): Promise<CashRegister> {
    try {
      const response = await fetch(`${url}/cash-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          branch_id: branchId,
          register_name: registerName,
          is_active: isActive,
          cash_register_key: cashRegisterKey ?? null,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al crear caja registradora");
        throw new Error(message);
      }

      return (json as ApiResponse<{ created: CashRegister }>).data.created;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al crear caja registradora",
      );
    }
  },

  async list(branchId?: string): Promise<CashRegister[]> {
    try {
      const target = branchId
        ? `${url}/cash-register?branch_id=${branchId}`
        : `${url}/cash-register`;
      const response = await fetch(target, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json: ApiResponse<ListWrapper<CashRegister>> = await response.json();
      return json.data?.results ?? [];
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar cajas registradoras",
      );
    }
  },

  async listSessions(filters?: {
    branchId?: string;
    isActive?: boolean | null;
  }): Promise<CashRegisterSession[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.branchId) params.set("branch_id", filters.branchId);
      if (filters?.isActive !== undefined && filters?.isActive !== null) {
        params.set("is_active", String(filters.isActive));
      }
      const query = params.toString();
      const response = await fetch(
        `${url}/cash-register/sessions/all${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );
      const json: ApiResponse<ListWrapper<CashRegisterSession>> =
        await response.json();
      return json.data?.results ?? [];
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar sesiones de caja",
      );
    }
  },

  async getById(cashRegisterId: string): Promise<CashRegister | null> {
    try {
      const response = await fetch(`${url}/cash-register/${cashRegisterId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json: ApiResponse<SingleWrapper<CashRegister>> =
        await response.json();
      return json.data?.result ?? null;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener caja registradora",
      );
    }
  },

  async startSession(
    cashRegisterId: string,
    openingAmount: number,
    openedAt?: string,
    cashRegisterKey?: string,
  ): Promise<CashRegisterSession> {
    try {
      const response = await fetch(`${url}/cash-register/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cash_register_id: cashRegisterId,
          opening_amount: openingAmount,
          opened_at: openedAt ?? new Date().toISOString(),
          ...(cashRegisterKey ? { cash_register_key: cashRegisterKey } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al abrir la sesión de caja");
        throw new Error(message);
      }
      return (json as ApiResponse<{ started: CashRegisterSession }>).data
        .started;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al abrir sesión",
      );
    }
  },

  async closeSession(
    sessionId: string,
    closingAmount: number,
    closedAt?: string,
    cashRegisterKey?: string,
  ): Promise<CashRegisterSession> {
    try {
      const response = await fetch(`${url}/cash-register/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cash_register_session_id: sessionId,
          closing_amount: closingAmount,
          closed_at: closedAt ?? new Date().toISOString(),
          ...(cashRegisterKey ? { cash_register_key: cashRegisterKey } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al cerrar la sesión");
        throw new Error(message);
      }
      return (json as ApiResponse<{ closed: CashRegisterSession }>).data.closed;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al cerrar sesión",
      );
    }
  },
};
