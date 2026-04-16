import api from "./api";
import type { ICategory, ICategoriesResponse } from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const categoryService = {
  // Get all categories (without pagination — for small datasets)
  async getAll(): Promise<ICategory[]> {
    const res = await api.get<ApiResponse<ICategory[]>>("/category");
    return res.data.data;
  },

  // Get categories paginated with optional text search
  async search(search: string, limit = 100, offset = 0): Promise<ICategory[]> {
    const res = await api.get<ApiResponse<ICategory[]>>("/category", {
      params: { search: search || undefined, limit, offset },
    });
    return res.data.data;
  },

  // Get categories (alternative endpoint)
  async list(): Promise<ICategoriesResponse> {
    const res = await api.get<ApiResponse<ICategoriesResponse>>("/categories");
    return res.data.data;
  },

  // Get category by ID
  async getById(categoryId: string): Promise<ICategory> {
    const res = await api.get<ApiResponse<ICategory>>(
      `/category/${categoryId}`,
    );
    return res.data.data;
  },
};
