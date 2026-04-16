import api from "./api";
import type {
  IProduct,
  ICreateProductRequest,
  IUpdateProductRequest,
  IProductsListResponse,
} from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const productService = {
  // Create new product
  async create(data: ICreateProductRequest): Promise<IProduct> {
    const res = await api.post<ApiResponse<IProduct>>("/product", data);
    return res.data.data;
  },

  // Get all products (superuser — no tenant filter)
  async listAll(page = 1, limit = 100): Promise<IProductsListResponse> {
    const res = await api.get<ApiResponse<IProductsListResponse>>(
      "/product/all",
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  // Get products for a tenant
  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<IProductsListResponse> {
    const res = await api.get<ApiResponse<IProductsListResponse>>(
      `/product/${tenantId}`,
      {
        params: { page, limit },
      },
    );
    return res.data.data;
  },

  // Get product by ID
  async getById(productId: string): Promise<IProduct> {
    const res = await api.get<ApiResponse<IProduct>>(`/product/${productId}`);
    return res.data.data;
  },

  // Update product
  async update(
    productId: string,
    data: IUpdateProductRequest,
  ): Promise<IProduct> {
    const res = await api.patch<ApiResponse<IProduct>>(
      `/product/${productId}`,
      data,
    );
    return res.data.data;
  },

  // Delete product
  async delete(productId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/product/${productId}`,
    );
    return res.data.data;
  },

  // Search products by name or SKU
  async search(
    tenantId: string,
    query: string,
    page = 1,
    limit = 100,
  ): Promise<IProductsListResponse> {
    const res = await api.get<ApiResponse<IProductsListResponse>>(
      `/product/${tenantId}/search`,
      {
        params: { q: query, page, limit },
      },
    );
    return res.data.data;
  },

  // Filter products by category
  async filterByCategory(
    tenantId: string,
    categoryId: string,
    page = 1,
    limit = 100,
  ): Promise<IProductsListResponse> {
    const res = await api.get<ApiResponse<IProductsListResponse>>(
      `/product/${tenantId}`,
      {
        params: { category_id: categoryId, page, limit },
      },
    );
    return res.data.data;
  },
};
