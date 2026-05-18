export interface InventoryTransferDetailProduct {
  product_variant_id: string;
  variant_name: string;
  sku: string;
  quantity: number;
}

export interface InventoryTransferDetail {
  inventory_transfer_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_name: string;
  transfer_date: string;
  inventory_transfer_departure_date: string;
  inventory_transfer_arrival_date: string | null;
  created_at: string;
  updated_at: string;
  products: InventoryTransferDetailProduct[];
  log_type_out_name: string;
  log_type_in_name: string;
}

export interface InventoryTransferRequestDetailProduct {
  product_variant_id: string;
  variant_name: string;
  sku: string;
  amount: number;
}

export interface InventoryTransferRequestDetail {
  inventory_transfer_request_id: string;
  tenant_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  inventory_transfer_request_status_id: number;
  status_name: string;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  rejection_reason: string | null;
  inventory_transfer_id: string | null;
  created_at: string;
  updated_at: string;
  products: InventoryTransferRequestDetailProduct[];
}
