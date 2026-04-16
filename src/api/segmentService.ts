import api from "./api";
import type { ISegment, ISegmentsListResponse } from "./types/auth";

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export const segmentService = {
  // Get all segments
  async getAll(): Promise<ISegment[]> {
    const res = await api.get<ApiResponse<ISegment[]>>("/segment");
    return res.data.data;
  },

  // Get segments list (alternative endpoint)
  async list(): Promise<ISegmentsListResponse> {
    const res = await api.get<ApiResponse<ISegmentsListResponse>>("/segments");
    return res.data.data;
  },

  // Get segment by ID
  async getById(segmentId: string): Promise<ISegment> {
    const res = await api.get<ApiResponse<ISegment>>(`/segment/${segmentId}`);
    return res.data.data;
  },

  // Create segment
  async create(data: Partial<ISegment>): Promise<ISegment> {
    const res = await api.post<ApiResponse<ISegment>>("/segment", data);
    return res.data.data;
  },

  // Update segment
  async update(segmentId: string, data: Partial<ISegment>): Promise<ISegment> {
    const res = await api.patch<ApiResponse<ISegment>>(
      `/segment/${segmentId}`,
      data,
    );
    return res.data.data;
  },

  // Delete segment
  async delete(segmentId: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/segment/${segmentId}`,
    );
    return res.data.data;
  },
};
