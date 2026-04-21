import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateCustomerRequest } from "@/interfaces/api/requests/CreateCustomerRequest.interface";
import type { UpdateCustomerRequest } from "@/interfaces/api/requests/UpdateCustomerRequest.interface";
import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CustomersListResponse } from "@/interfaces/api/responses/CustomersListResponse.interface";

export const customerApi = {
  async create(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await fetch(`${url}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Customer> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear cliente",
      );
    }
  },

  async listAll(page = 1, limit = 100): Promise<CustomersListResponse> {
    try {
      const response = await fetch(
        `${url}/customers/all?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<CustomersListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar clientes",
      );
    }
  },

  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<CustomersListResponse> {
    try {
      const response = await fetch(
        `${url}/customers/tenant/${tenantId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<CustomersListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar clientes del tenant",
      );
    }
  },

  async getById(customerId: string): Promise<Customer> {
    try {
      const response = await fetch(`${url}/customers/${customerId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Customer> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener cliente",
      );
    }
  },

  async getByDocNumber(docNumber: string): Promise<Customer> {
    try {
      const response = await fetch(`${url}/customers/doc/${docNumber}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Customer> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener cliente",
      );
    }
  },

  async update(
    customerId: string,
    data: UpdateCustomerRequest,
  ): Promise<Customer> {
    try {
      const response = await fetch(`${url}/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Customer> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al actualizar cliente",
      );
    }
  },

  async delete(customerId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/customers/${customerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar cliente",
      );
    }
  },

  async search(
    tenantId: string,
    query: string,
    page = 1,
    limit = 100,
  ): Promise<CustomersListResponse> {
    try {
      const response = await fetch(
        `${url}/customers/tenant/${tenantId}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<CustomersListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al buscar clientes",
      );
    }
  },

  async filterBySegment(
    tenantId: string,
    segmentId: string,
    page = 1,
    limit = 100,
  ): Promise<CustomersListResponse> {
    try {
      const response = await fetch(
        `${url}/customers/tenant/${tenantId}?segment_id=${segmentId}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<CustomersListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al filtrar clientes por segmento",
      );
    }
  },
};
