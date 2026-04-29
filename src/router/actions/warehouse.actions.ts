import { warehouseApi } from "@/api/warehouse.api";
import { branchApi } from "@/api/branch.api";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { CreateWarehouseRequest } from "@/interfaces/api/requests/CreateWarehouseRequest.interface";
import type { UpdateWarehouseRequest } from "@/interfaces/api/requests/UpdateWarehouseRequest.interface";
import type { NewBranchRequest } from "@/interfaces/api/requests/NewBranchRequest.interface";

export const createWarehouse = async (
  data: CreateWarehouseRequest,
): Promise<Warehouse> => warehouseApi.create(data);

export const updateWarehouse = async (
  warehouseId: string,
  data: UpdateWarehouseRequest,
): Promise<Warehouse> => warehouseApi.update(warehouseId, data);

export const deleteWarehouse = async (
  warehouseId: string,
): Promise<{ message: string }> => warehouseApi.delete(warehouseId);

export interface CreateBranchWithWarehouseInput {
  branch: NewBranchRequest;
  warehouse: Pick<CreateWarehouseRequest, "warehouse_address">;
}

export const createBranchWithSalesFloor = async ({
  branch,
}: CreateBranchWithWarehouseInput): Promise<{
  branch_id: string;
  warehouse: Warehouse | null;
}> => {
  const created = await branchApi.create(branch);
  const tenantWarehouses = await warehouseApi.listByTenant();
  const salesFloor =
    tenantWarehouses.find(
      (w) => w.branch_id === created.branch_id && w.is_branch === true,
    ) ?? null;

  return { branch_id: created.branch_id, warehouse: salesFloor };
};
