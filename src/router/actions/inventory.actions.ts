import { warehouseApi } from "@/api/warehouse.api";

import type { BulkInsertInventoryRequest } from "@/interfaces/api/requests/BulkInsertInventoryRequest.interface";
import type { CreateDiscrepancyReportRequest } from "@/interfaces/api/requests/CreateDiscrepancyReportRequest.interface";
import type { UpdateInventoryItemRequest } from "@/interfaces/api/requests/UpdateInventoryItemRequest.interface";
import type { DiscrepancyReport } from "@/interfaces/entities/DiscrepancyReport.interface";
import type { InventoryItem } from "@/interfaces/entities/InventoryItem.interface";

export const bulkInsertInventory = async (
  data: BulkInsertInventoryRequest,
): Promise<{ inserted: number }> => warehouseApi.bulkInsertInventory(data);

export const createDiscrepancyReport = async (
  data: CreateDiscrepancyReportRequest,
): Promise<DiscrepancyReport> => warehouseApi.createDiscrepancyReport(data);

export const updateInventoryItem = async (
  inventoryId: string,
  data: UpdateInventoryItemRequest,
): Promise<InventoryItem> => warehouseApi.updateInventoryItem(inventoryId, data);

export const deleteInventoryItem = async (
  inventoryId: string,
): Promise<{ message: string }> =>
  warehouseApi.deleteInventoryItem(inventoryId);
