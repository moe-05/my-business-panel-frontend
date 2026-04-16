export const url =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
export { regionsApi } from "./regions.api";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
