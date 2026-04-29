import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  Promotion,
  PromotionType,
} from "@/interfaces/entities/Promotion.interface";
import type { CreatePromotionRequest } from "@/interfaces/api/requests/CreatePromotionRequest.interface";
import type { UpdatePromotionRequest } from "@/interfaces/api/requests/UpdatePromotionRequest.interface";

const unwrap = <T>(json: ApiResponse<T> | T): T => {
  const maybe = json as ApiResponse<T>;
  return maybe?.data !== undefined ? maybe.data : (json as T);
};

export const promotionApi = {
  async getByTenant(tenantId: string): Promise<Promotion[]> {
    try {
      const response = await fetch(`${url}/promos/${tenantId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json = await response.json();
      const data = unwrap<Promotion[]>(json);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener promociones",
      );
    }
  },

  async getInfo(promotionId: string): Promise<Promotion | null> {
    try {
      const response = await fetch(`${url}/promos/info/${promotionId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) return null;
      const json = await response.json();
      return unwrap<Promotion>(json);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener la promoción",
      );
    }
  },

  async getTypes(): Promise<PromotionType[]> {
    try {
      const response = await fetch(`${url}/promos`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json = await response.json();
      const data = unwrap<PromotionType[]>(json);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al obtener tipos de promoción",
      );
    }
  },

  async create(data: CreatePromotionRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/promos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al crear promoción");
        throw new Error(message);
      }
      return unwrap<{ message: string }>(json);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear promoción",
      );
    }
  },

  async update(
    promotionId: string,
    data: UpdatePromotionRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/promos/${promotionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al actualizar promoción");
        throw new Error(message);
      }
      return unwrap<{ message: string }>(json);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al actualizar promoción",
      );
    }
  },

  async delete(promotionId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/promos/${promotionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok) {
        const message = Array.isArray(json?.message)
          ? json.message.join(", ")
          : (json?.message ?? "Error al eliminar promoción");
        throw new Error(message);
      }
      return unwrap<{ message: string }>(json);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al eliminar promoción",
      );
    }
  },
};
