import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { CreateProductRequest } from "@/interfaces/api/requests/CreateProductRequest.interface";
import type { UpdateProductRequest } from "@/interfaces/api/requests/UpdateProductRequest.interface";
import type { Product } from "@/interfaces/entities/Product.interface";
import type { ProductsListResponse } from "@/interfaces/api/responses/ProductsListResponse.interface";

export const productApi = {
  async create(data: CreateProductRequest): Promise<Product> {
    try {
      const response = await fetch(`${url}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Product> = await response.json();
      return json.data;
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
