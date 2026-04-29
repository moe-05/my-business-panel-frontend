export interface Warehouse {
  warehouse_id: string;
  branch_id: string;
  warehouse_name: string;
  warehouse_address: string;
  is_branch: boolean;
  branch_name?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}
