import { warehouseApi } from "@/api/warehouse.api";
import { authApi } from "@/api/auth.api";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";

export interface ReportsPageLoaderData {
  warehouses: Warehouse[];
  tenantId: string | null;
}

export const getReportsPageData = async (): Promise<ReportsPageLoaderData> => {
  const currentUser = await authApi.getCurrentUser();
  const tenantId = currentUser?.tenant?.tenant_id ?? null;

  const warehouses = await warehouseApi
    .listByTenant()
    .catch(() => [] as Warehouse[]);

  return { warehouses, tenantId };
};
