import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateProductRequest } from "@/interfaces/api/requests/CreateProductRequest.interface";
import type { UpdateProductRequest } from "@/interfaces/api/requests/UpdateProductRequest.interface";
import type { Product } from "@/interfaces/entities/Product.interface";
import type { ProductsListResponse } from "@/interfaces/api/responses/ProductsListResponse.interface";

export interface BulkProductInput {
  tenant_id: string;
  sku: string;
  variant_name: string;
  cabys_code?: string | null;
  unit_price: number;
  cost_price?: number;
  attribute_value_ids?: string[];
  group_ids?: string[];
}

export const productApi = {
  async createBulk(
    products: BulkProductInput[],
  ): Promise<Array<{ product_variant_id: string }>> {
    const response = await fetch(`${url}/product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ products }),
    });

    const json = await response.json();
    if (!response.ok) {
      const msg = Array.isArray(json.message)
        ? json.message[0]
        : (json.message ?? `Error ${response.status}`);
      throw new Error(msg);
    }

    const created = json.data?.product ?? [];
    return created as Array<{ product_variant_id: string }>;
  },

  async create(data: CreateProductRequest): Promise<{ product_variant_id: string }> {
    try {
      const response = await fetch(`${url}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          products: [
            {
              tenant_id: data.tenant_id,
              sku: data.sku,
              variant_name: data.product_name,
              cabys_code: data.cabys_code ?? null,
              unit_price: data.price,
              cost_price: data.cost_price ?? 0,
              attribute_value_ids: data.attribute_value_ids ?? [],
              group_ids: data.group_ids ?? [],
            },
          ],
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        const msg = Array.isArray(json.message)
          ? json.message[0]
          : (json.message ?? `Error ${response.status}`);
        throw new Error(msg);
      }

      const variant = json.data?.product?.[0];
      if (!variant?.product_variant_id) {
        throw new Error("El producto ya existe o no pudo crearse");
      }
      return variant as { product_variant_id: string };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear producto",
      );
    }
  },

  async listAll(page = 1, limit = 100): Promise<ProductsListResponse> {
    try {
      const response = await fetch(
        `${url}/product/all?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<ProductsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar productos",
      );
    }
  },

  async listByTenant(
    tenantId: string,
    page = 1,
    limit = 100,
  ): Promise<ProductsListResponse> {
    try {
      const response = await fetch(
        `${url}/product/${tenantId}?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<ProductsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar productos del tenant",
      );
    }
  },

  async getById(productId: string): Promise<Product> {
    try {
      const response = await fetch(`${url}/product/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Product> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener producto",
      );
    }
  },

  async getByIdWithAttributes(
    tenantId: string,
    productId: string,
  ): Promise<
    Product & {
      is_composite?: boolean;
      attributes: Array<{
        attribute_value_id: string;
        value: string;
        tenant_attribute_id: string;
        attribute_name: string;
      }>;
      groups: Array<{
        tenant_product_group_id: string;
        group_name: string;
        tenant_product_group_type_id: string;
        type_name: string;
      }>;
    }
  > {
    const response = await fetch(
      `${url}/product/${tenantId}/${productId}/with-attributes`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    const json = await response.json();
    if (!response.ok) {
      const msg = Array.isArray(json.message)
        ? json.message[0]
        : (json.message ?? `Error ${response.status}`);
      throw new Error(msg || "Error al obtener producto con atributos");
    }
    return json.data ?? json;
  },

  async update(productId: string, data: UpdateProductRequest): Promise<Product> {
    try {
      const response = await fetch(`${url}/product/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Product> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al actualizar producto",
      );
    }
  },

  async delete(productId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/product/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar producto",
      );
    }
  },

  async search(
    tenantId: string,
    query: string,
    page = 1,
    limit = 100,
  ): Promise<ProductsListResponse> {
    try {
      const response = await fetch(
        `${url}/product/${tenantId}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<ProductsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al buscar productos",
      );
    }
  },

  async filterByCategory(
    tenantId: string,
    categoryId: string,
    page = 1,
    limit = 100,
  ): Promise<ProductsListResponse> {
    try {
      const response = await fetch(
        `${url}/product/${tenantId}?category_id=${categoryId}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      const json: ApiResponse<ProductsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al filtrar productos por categoría",
      );
    }
  },
};
