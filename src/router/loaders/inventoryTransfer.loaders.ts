import { warehouseApi } from "@/api/warehouse.api";
import { authApi } from "@/api/auth.api";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { InventoryTransfer } from "@/interfaces/entities/InventoryTransfer.interface";

export interface MovementsPageLoaderData {
  transfers: InventoryTransfer[];
  warehouses: Warehouse[];
  tenantId: string | null;
}

export const getMovementsPageData =
  async (): Promise<MovementsPageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const tenantId = currentUser?.tenant?.tenant_id ?? null;

    const [transfers, warehouses] = await Promise.all([
      warehouseApi.listTransfers().catch(() => [] as InventoryTransfer[]),
      warehouseApi.listByTenant().catch(() => [] as Warehouse[]),
    ]);

    return { transfers, warehouses, tenantId };
  };
