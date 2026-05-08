import { authApi } from "@/api/auth.api";
import { branchApi } from "@/api/branch.api";
import { posExpenseApi } from "@/api/posExpense.api";
import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { ExpenseType } from "@/interfaces/entities/PosExpense.interface";

export interface PosExpensePageLoaderData {
  branches: Branch[];
  expenseTypes: ExpenseType[];
  tenantId: string;
}

export const getPosExpensePageData =
  async (): Promise<PosExpensePageLoaderData> => {
    const user = await authApi.getCurrentUser();
    const tenantId = user?.tenant?.tenant_id ?? "";

    const [branchRes, expenseTypes] = await Promise.all([
      branchApi.listByTenant(tenantId, 1, 200),
      tenantId ? posExpenseApi.listTypes(tenantId) : Promise.resolve([]),
    ]);

    return {
      branches: branchRes.branches,
      expenseTypes,
      tenantId,
    };
  };
