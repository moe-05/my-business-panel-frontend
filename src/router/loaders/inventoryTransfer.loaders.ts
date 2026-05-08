import { authApi } from "@/api/auth.api";
import { warehouseApi } from "@/api/warehouse.api";

export async function getMovementsPageData() {
  const currentUser = await authApi.getCurrentUser();
  const tenantId = currentUser?.tenant?.tenant_id ?? null;

  const [transfers, warehouses, requests] = await Promise.all([
    warehouseApi.listTransfers(),
    warehouseApi.listByTenant(),
    warehouseApi.listTransferRequests()
  ]);
  return { transfers, warehouses, requests, tenantId };
}

export type MovementsPageLoaderData = Awaited<ReturnType<typeof getMovementsPageData>>;

