import { warehouseApi } from "@/api/warehouse.api";

import type { CreateInventoryTransferRequest } from "@/interfaces/api/requests/CreateInventoryTransferRequest.interface";

export const createInventoryTransfer = async (
  data: CreateInventoryTransferRequest,
): Promise<{ message: string; inventory_transfer_id: string }> =>
  warehouseApi.createTransfer(data);
