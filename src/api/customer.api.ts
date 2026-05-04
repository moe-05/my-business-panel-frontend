import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateCustomerRequest } from "@/interfaces/api/requests/CreateCustomerRequest.interface";
import type { UpdateCustomerRequest } from "@/interfaces/api/requests/UpdateCustomerRequest.interface";
import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CustomersListResponse } from "@/interfaces/api/responses/CustomersListResponse.interface";
import type {
  CustomerDetail,
  CustomerSalesHistoryResponse,
} from "@/interfaces/entities/CustomerDetail.interface";

export const customerApi = {
  async create(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await fetch(`${url}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Error ${response.status} al crear cliente`);
      }

      const json: ApiResponse<Customer> = await response.json();

      if (!json.data?.customer_id) {
        throw new Error("El servidor no devolvió el ID del cliente creado");
      }

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
      console.log(json);
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

  async checkAvailability(params: {
    tenantId: string;
    field: "document_number" | "email" | "phone";
    value: string;
    excludeId?: string;
  }): Promise<{ exists: boolean }> {
    const search = new URLSearchParams({
      tenant_id: params.tenantId,
      field: params.field,
      value: params.value,
    });
    if (params.excludeId) search.set("exclude_id", params.excludeId);

    const response = await fetch(
      `${url}/customers/availability?${search.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );

    if (!response.ok) {
      // If the probe itself fails, fall back to "not taken" so the user is
      // not blocked. The unique constraint at the DB level remains the source
      // of truth on submit.
      return { exists: false };
    }

    const json: ApiResponse<{ exists: boolean }> = await response.json();
    return json.data ?? { exists: false };
  },

  async getByDocNumber(docNumber: string): Promise<Customer> {
    const response = await fetch(`${url}/customers/doc/${docNumber}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Cliente no encontrado (${response.status})`);
    }

    const json: ApiResponse<Customer> = await response.json();

    if (!json.data?.customer_id) {
      throw new Error("Respuesta del servidor no incluye el ID del cliente");
    }

    return json.data;
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

  async getDetail(customerId: string): Promise<CustomerDetail> {
    const response = await fetch(`${url}/customers/${customerId}/detail`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status} al obtener detalle del cliente`);
    }
    const json: ApiResponse<CustomerDetail> = await response.json();
    return json.data;
  },

  async getSalesHistory(
    customerId: string,
    page = 1,
    limit = 10,
  ): Promise<CustomerSalesHistoryResponse> {
    const response = await fetch(
      `${url}/customers/${customerId}/sales?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status} al obtener historial de ventas`);
    }
    const json: ApiResponse<CustomerSalesHistoryResponse> = await response.json();
    return json.data;
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
