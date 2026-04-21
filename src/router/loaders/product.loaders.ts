import { productApi } from "@/api/product.api";

import type { Product } from "@/interfaces/entities/Product.interface";
import type { ProductsListResponse } from "@/interfaces/api/responses/ProductsListResponse.interface";

export const getAllProducts = async (
  page = 1,
  limit = 100,
): Promise<ProductsListResponse> => productApi.listAll(page, limit);

export const getProductsByTenant = async (
  tenantId: string,
  page = 1,
  limit = 100,
): Promise<ProductsListResponse> =>
  productApi.listByTenant(tenantId, page, limit);

export const getProductById = async (productId: string): Promise<Product> =>
  productApi.getById(productId);

export const searchProducts = async (
  tenantId: string,
  query: string,
  page = 1,
  limit = 100,
): Promise<ProductsListResponse> =>
  productApi.search(tenantId, query, page, limit);

export const getProductsByCategory = async (
  tenantId: string,
  categoryId: string,
  page = 1,
  limit = 100,
): Promise<ProductsListResponse> =>
  productApi.filterByCategory(tenantId, categoryId, page, limit);
