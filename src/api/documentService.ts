import api from "./api";
import type { IDocumentType, IDocumentTypesResponse } from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const documentService = {
  // Get all document types
  async getAll(): Promise<IDocumentType[]> {
    const res = await api.get<ApiResponse<IDocumentType[]>>("/document");
    return res.data.data;
  },

  // Get document types response
  async list(): Promise<IDocumentTypesResponse> {
    const res =
      await api.get<ApiResponse<IDocumentTypesResponse>>("/documents");
    return res.data.data;
  },
};
