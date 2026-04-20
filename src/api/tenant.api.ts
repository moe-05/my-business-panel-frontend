import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { NewTenantRequest } from "@/interfaces/api/requests/NewTenantRequest.interface";
import type { Tenant } from "@/interfaces/entities/Tenant.interface";
import type { OnboardingRequest } from "@/interfaces/api/requests/OnboardingRequest.interface";
import type { OnboardingResponse } from "@/interfaces/api/responses/OnboardingResponse.interface";
import type { UsersListResponse } from "@/interfaces/api/responses/UsersListResponse.interface";
import type { TenantListResponse } from "@/interfaces/api/responses/TenantListResponse.interface";

export const tenantApi = {
  async create(data: NewTenantRequest): Promise<Tenant> {
    try {
      const response = await fetch(`${url}/tenant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Tenant> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create tenant",
      );
    }
  },

  async onboard(data: OnboardingRequest): Promise<OnboardingResponse> {
    const response = await fetch(`${url}/tenant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      const message =
        json?.message ??
        json?.error ??
        "Error al registrar el tenant";
      throw new Error(Array.isArray(message) ? message.join(", ") : message);
    }

    return (json as ApiResponse<OnboardingResponse>).data;
  },

  async getAll(page = 1, limit = 20): Promise<TenantListResponse> {
    try {
      const response = await fetch(
        `${url}/tenant?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const json: ApiResponse<TenantListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch tenants",
      );
    }
  },

  async getById(tenantId: string): Promise<Tenant> {
    try {
      const response = await fetch(`${url}/tenant/${tenantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json: ApiResponse<Tenant> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch tenant",
      );
    }
  },

  async update(
    tenantId: string,
    data: Partial<NewTenantRequest>,
  ): Promise<Tenant> {
    try {
      const response = await fetch(`${url}/tenant/${tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Tenant> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update tenant",
      );
    }
  },

  async delete(tenantId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/tenant/${tenantId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete tenant",
      );
    }
  },

  async getTenantUsers(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<UsersListResponse> {
    try {
      const response = await fetch(
        `${url}/tenant/${tenantId}/users?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const json: ApiResponse<UsersListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch tenant users",
      );
    }
  },

  async search(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<TenantListResponse> {
    try {
      const response = await fetch(
        `${url}/tenant/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const json: ApiResponse<TenantListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to search tenants",
      );
    }
  },
};
