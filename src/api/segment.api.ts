import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";
import type { SegmentsListResponse } from "@/interfaces/api/responses/SegmentsListResponse.interface";

export const segmentApi = {
  async getAll(): Promise<Segment[]> {
    try {
      const response = await fetch(`${url}/segment`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Segment[]> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener segmentos",
      );
    }
  },

  async list(): Promise<SegmentsListResponse> {
    try {
      const response = await fetch(`${url}/segments`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<SegmentsListResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al listar segmentos",
      );
    }
  },

  async getById(segmentId: string): Promise<Segment> {
    try {
      const response = await fetch(`${url}/segment/${segmentId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<Segment> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener segmento",
      );
    }
  },

  async create(data: Partial<Segment>): Promise<Segment> {
    try {
      const response = await fetch(`${url}/segment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Segment> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al crear segmento",
      );
    }
  },

  async update(segmentId: string, data: Partial<Segment>): Promise<Segment> {
    try {
      const response = await fetch(`${url}/segment/${segmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<Segment> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al actualizar segmento",
      );
    }
  },

  async delete(segmentId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/segment/${segmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al eliminar segmento",
      );
    }
  },
};
