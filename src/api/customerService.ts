import api from "./api";
import type {
  ICustomer,
  ICreateCustomerRequest,
  IUpdateCustomerRequest,
  ICustomersListResponse,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const customerService = {
  // Create new customer
  async create(data: ICreateCustomerRequest): Promise<ICustomer> {
    const res = await api.post<ApiResponse<ICustomer>>("/customers", data);
    return res.data.data;
  },

  // Get all customers (superuser — no tenant filter)
  async listAll(page = 1, limit = 100): Promise<ICustomersListResponse> {
    const res = await api.get<ApiResponse<ICustomersListResponse>>(
      "/customers/all",
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  // Get customers for a tenant
  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<ICustomersListResponse> {
    const res = await api.get<ApiResponse<ICustomersListResponse>>(
      `/customers/tenant/${tenantId}`,
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  // Get customer by ID
  async getById(customerId: string): Promise<ICustomer> {
    const res = await api.get<ApiResponse<ICustomer>>(
      `/customers/${customerId}`,
    );
    return res.data.data;
  },

  // Get customer by document number
  async getByDocNumber(docNumber: string): Promise<ICustomer> {
    const res = await api.get<ApiResponse<ICustomer>>(
      `/customers/doc/${docNumber}`,
    );
    return res.data.data;
  },

  // Update customer
  async update(
    customerId: string,
    data: IUpdateCustomerRequest,
  ): Promise<ICustomer> {
    const res = await api.patch<ApiResponse<ICustomer>>(
      `/customers/${customerId}`,
      data,
    );
    return res.data.data;
  },

  // Delete customer
  async delete(customerId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/customers/${customerId}`,
    );
    return res.data.data;
  },

  // Search customers by name, email, or document
  async search(
    tenantId: string,
    query: string,
    page = 1,
    limit = 100,
  ): Promise<ICustomersListResponse> {
    const res = await api.get<ApiResponse<ICustomersListResponse>>(
      `/customers/tenant/${tenantId}/search`,
      { params: { q: query, page, limit } },
    );
    return res.data.data;
  },

  // Filter customers by segment
  async filterBySegment(
    tenantId: string,
    segmentId: string,
    page = 1,
    limit = 100,
  ): Promise<ICustomersListResponse> {
    const res = await api.get<ApiResponse<ICustomersListResponse>>(
      `/customers/tenant/${tenantId}`,
      { params: { segment_id: segmentId, page, limit } },
    );
    return res.data.data;
  },
};
