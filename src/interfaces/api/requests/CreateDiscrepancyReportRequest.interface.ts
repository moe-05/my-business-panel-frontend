export interface CreateDiscrepancyReportRequest {
  product_id: string;
  warehouse_id: string;
  stored_quantity: number;
  physical_quantity: number;
  discrepancy_reason?: string;
}
