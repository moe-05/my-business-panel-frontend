export interface InventoryTransferProductInput {
  product_id: string;
  amount: number;
}

export interface CreateInventoryTransferRequest {
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  tenant_id: string;
  departure_date?: string | null;
  arrival_date?: string | null;
  products: InventoryTransferProductInput[];
}
