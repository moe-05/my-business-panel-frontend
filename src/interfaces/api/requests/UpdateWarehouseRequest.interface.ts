/**
 * Editable fields on an existing warehouse. The `is_branch` flag is
 * intentionally omitted: a warehouse cannot be promoted to / demoted from
 * sales floor through the API because that would corrupt the 1-1 invariant
 * with its branch (uq_warehouse_branch_sales_floor).
 */
export interface UpdateWarehouseRequest {
  warehouse_name?: string;
  warehouse_address?: string;
}
