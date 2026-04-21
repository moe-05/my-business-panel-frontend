import { categoryApi } from "@/api/category.api";

import type { Category } from "@/interfaces/entities/Category.interface";

export const getCategories = async (): Promise<Category[]> =>
  categoryApi.getAll();

export const searchCategories = async (
  search: string,
  limit = 100,
  offset = 0,
): Promise<Category[]> => categoryApi.search(search, limit, offset);

export const getCategoryById = async (categoryId: string): Promise<Category> =>
  categoryApi.getById(categoryId);
