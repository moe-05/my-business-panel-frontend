import { branchApi } from "@/api/branch.api";

import type { NewBranchRequest } from "@/interfaces/api/requests/NewBranchRequest.interface";
import type { UpdateBranchRequest } from "@/interfaces/api/requests/UpdateBranchRequest.interface";
import type { Branch } from "@/interfaces/entities/Branch.interface";

export const createBranch = async (data: NewBranchRequest): Promise<Branch> =>
  branchApi.create(data);

export const updateBranch = async (
  branchId: string,
  data: UpdateBranchRequest,
): Promise<Branch> => branchApi.update(branchId, data);

export const deleteBranch = async (
  branchId: string,
): Promise<{ message: string }> => branchApi.delete(branchId);
