import type { Product } from "@/interfaces/entities/Product.interface";

export interface ProductsListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}
