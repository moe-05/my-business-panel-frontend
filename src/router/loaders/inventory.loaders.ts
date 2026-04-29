import { warehouseApi } from "@/api/warehouse.api";
import { authApi } from "@/api/auth.api";
import { productApi } from "@/api/product.api";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { ProductsListResponse } from "@/interfaces/api/responses/ProductsListResponse.interface";

export interface InventoryPageLoaderData {
  warehouses: Warehouse[];
  products: ProductsListResponse;
  tenantId: string | null;
}

export const getInventoryPageData =
  async (): Promise<InventoryPageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const tenantId = currentUser?.tenant?.tenant_id ?? null;

    const [warehouses, products] = await Promise.all([
      warehouseApi.listByTenant().catch(() => [] as Warehouse[]),
      tenantId
        ? productApi.listByTenant(tenantId, 1, 500).catch(() => ({
            products: [],
            total: 0,
            page: 1,
            limit: 0,
          }))
        : Promise.resolve({ products: [], total: 0, page: 1, limit: 0 }),
    ]);

    return { warehouses, products, tenantId };
  };
