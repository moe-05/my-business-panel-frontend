import { productApi } from "@/api/product.api";

import type { CreateProductRequest } from "@/interfaces/api/requests/CreateProductRequest.interface";
import type { UpdateProductRequest } from "@/interfaces/api/requests/UpdateProductRequest.interface";
import type { Product } from "@/interfaces/entities/Product.interface";

export const createProduct = async (
  data: CreateProductRequest,
): Promise<{ product_variant_id: string }> => productApi.create(data);

export const updateProduct = async (
  productId: string,
  data: UpdateProductRequest,
): Promise<Product> => productApi.update(productId, data);

export const deleteProduct = async (
  productId: string,
): Promise<{ message: string }> => productApi.delete(productId);
