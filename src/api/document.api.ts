import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { DocumentType } from "@/interfaces/entities/DocumentType.interface";
import type { DocumentTypesResponse } from "@/interfaces/api/responses/DocumentTypesResponse.interface";

export const documentApi = {
  async getAll(): Promise<DocumentType[]> {
    try {
      const response = await fetch(`${url}/document`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<DocumentType[]> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener tipos de documento",
      );
    }
  },

  async list(): Promise<DocumentTypesResponse> {
    try {
      const response = await fetch(`${url}/documents`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<DocumentTypesResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al listar tipos de documento",
      );
    }
  },
};
