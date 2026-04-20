import type { User } from "@/interfaces/entities/User.interface";

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
