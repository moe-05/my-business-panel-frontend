import { warehouseApi } from "@/api/warehouse.api";
import { authApi } from "@/api/auth.api";
import { branchApi } from "@/api/branch.api";
import { withAuthCheck } from "./utils/withAuthCheck";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { Branch } from "@/interfaces/entities/Branch.interface";

export interface WarehousesPageLoaderData {
  warehouses: Warehouse[];
  branches: Branch[];
  tenantId: string | null;
}

export const getWarehousesPageData =
  async (): Promise<WarehousesPageLoaderData> =>
    withAuthCheck(async () => {
      const currentUser = await authApi.getCurrentUser();
      const tenantId = currentUser?.tenant?.tenant_id ?? null;

      const [warehouses, branchesResponse] = await Promise.all([
        warehouseApi.listByTenant().catch(() => [] as Warehouse[]),
        tenantId
          ? branchApi.listByTenant(tenantId, 1, 200)
          : Promise.resolve({ branches: [], total: 0, page: 1, limit: 0 }),
      ]);

      return {
        warehouses,
        branches: branchesResponse.branches ?? [],
        tenantId,
      };
    });
