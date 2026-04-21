import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateLoyaltyProgramRequest } from "@/interfaces/api/requests/CreateLoyaltyProgramRequest.interface";
import type { UpdateLoyaltyProgramRequest } from "@/interfaces/api/requests/UpdateLoyaltyProgramRequest.interface";
import type { LoyaltyProgram } from "@/interfaces/entities/LoyaltyProgram.interface";

export const loyaltyApi = {
  async getByTenant(tenantId: string): Promise<LoyaltyProgram[]> {
    try {
      const response = await fetch(`${url}/loyal-program/${tenantId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<LoyaltyProgram[]> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener programa de lealtad",
      );
    }
  },

  async create(data: CreateLoyaltyProgramRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/loyal-program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al crear programa de lealtad",
      );
    }
  },

  async update(
    programId: string,
    data: UpdateLoyaltyProgramRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/loyal-program/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al actualizar programa de lealtad",
      );
    }
  },

  async delete(programId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/loyal-program/${programId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al eliminar programa de lealtad",
      );
    }
  },
};
