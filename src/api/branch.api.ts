import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { NewBranchRequest } from "@/interfaces/api/requests/NewBranchRequest.interface";
import type { UpdateBranchRequest } from "@/interfaces/api/requests/UpdateBranchRequest.interface";
import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { BranchListResponse } from "@/interfaces/api/responses/BranchListResponse.interface";

export const branchApi = {
  async create(data: NewBranchRequest): Promise<Branch> {
    try {
      const response = await fetch(`${url}/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Branch> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear sucursal",
      );
    }
  },

  async list(page = 1, limit = 100): Promise<BranchListResponse> {
    try {
      const response = await fetch(
        `${url}/branch?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<BranchListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar sucursales",
      );
    }
  },

  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<BranchListResponse> {
    try {
      const response = await fetch(
        `${url}/branch/tenant/${tenantId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const message =
          errorJson?.message ?? "Error al listar sucursales del tenant";
        throw new Error(Array.isArray(message) ? message.join(", ") : message);
      }

      const json: ApiResponse<BranchListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar sucursales del tenant",
      );
    }
  },

  async getById(branchId: string): Promise<Branch> {
    try {
      const response = await fetch(`${url}/branch/${branchId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Branch> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener sucursal",
      );
    }
  },

  async update(branchId: string, data: UpdateBranchRequest): Promise<Branch> {
    try {
      const response = await fetch(`${url}/branch/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Branch> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al actualizar sucursal",
      );
    }
  },

  async delete(branchId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/branch/${branchId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar sucursal",
      );
    }
  },
};
