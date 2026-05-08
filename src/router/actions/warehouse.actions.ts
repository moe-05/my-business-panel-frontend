import { warehouseApi } from "@/api/warehouse.api";

import type { Warehouse } from "@/interfaces/entities/Warehouse.interface";
import type { CreateWarehouseRequest } from "@/interfaces/api/requests/CreateWarehouseRequest.interface";
import type { UpdateWarehouseRequest } from "@/interfaces/api/requests/UpdateWarehouseRequest.interface";

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
