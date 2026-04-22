import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateMarginRequest } from "@/interfaces/api/requests/CreateMarginRequest.interface";
import type { Margin } from "@/interfaces/entities/Margin.interface";
import type { MarginsListResponse } from "@/interfaces/api/responses/MarginsListResponse.interface";

type UpdateMarginRequest = Partial<
  Pick<
    CreateMarginRequest,
    "spending_threshold" | "seniority_months" | "frequency_per_month"
  >
>;

export const marginApi = {
  async listByTenant(tenantId: string): Promise<Margin[]> {
    try {
      const response = await fetch(`${url}/margin/${tenantId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Margin[]> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar márgenes del tenant",
      );
    }
  },

  async list(tenantId: string): Promise<MarginsListResponse> {
    try {
      const response = await fetch(`${url}/margins/${tenantId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<MarginsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar márgenes",
      );
    }
  },

  async create(data: CreateMarginRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/margin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear margen",
      );
    }
  },

  async update(
    marginId: string,
    data: UpdateMarginRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/margin/${marginId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al actualizar margen",
      );
    }
  },

  async delete(marginId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/margin/${marginId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar margen",
      );
    }
  },
};
