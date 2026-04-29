export interface DiscrepancyReport {
  discrepancy_count_id: string;
  tenant_id: string;
  product_variant_id: string;
  warehouse_id: string;
  stored_quantity: number;
  physical_quantity: number;
  discrepancy_reason: string | null;
  created_at: string;
  updated_at: string;
  variant_name: string | null;
  sku: string | null;
}
