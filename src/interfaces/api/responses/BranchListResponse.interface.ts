import type { Branch } from "@/interfaces/entities/Branch.interface";

export interface BranchListResponse {
  branches: Branch[];
  total: number;
  page: number;
  limit: number;
}
