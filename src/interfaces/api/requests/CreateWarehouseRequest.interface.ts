/**
 * Payload to register an auxiliary warehouse (bodega) for an existing
 * branch. Sales-floor warehouses (`is_branch = true`) are provisioned
 * automatically by the DB trigger when a branch is created, so this
 * request never sets that flag — the API ignores it on create.
 */
export interface CreateWarehouseRequest {
  branch_id: string;
  warehouse_name: string;
  warehouse_address: string;
}
