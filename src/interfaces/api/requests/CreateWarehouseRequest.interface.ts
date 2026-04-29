export interface CreateWarehouseRequest {
  branch_id: string;
  warehouse_name: string;
  warehouse_address: string;
  is_branch?: boolean;
}
