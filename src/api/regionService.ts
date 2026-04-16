import publicApi from "./publicApi";
import type { IRegion } from "./types/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const regionService = {
  async getAll(): Promise<IRegion[]> {
    const res = await publicApi.get<ApiResponse<IRegion[]>>("/region");
    return res.data.data;
  },
};
