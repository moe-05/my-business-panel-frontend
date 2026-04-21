import { branchApi } from "@/api/branch.api";

import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { BranchListResponse } from "@/interfaces/api/responses/BranchListResponse.interface";

export const getBranches = async (
  page = 1,
  limit = 100,
): Promise<BranchListResponse> => branchApi.list(page, limit);

export const getBranchesByTenant = async (
  tenantId: string,
  page = 1,
  limit = 100,
): Promise<BranchListResponse> => branchApi.listByTenant(tenantId, page, limit);

export const getBranchById = async (branchId: string): Promise<Branch> =>
  branchApi.getById(branchId);
