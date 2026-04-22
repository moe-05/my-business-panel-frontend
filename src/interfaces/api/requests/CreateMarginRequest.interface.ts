export interface CreateMarginRequest {
  tenant_id: string;
  customer_segment_id: number;
  customer_segment_margin_type: number;
  spending_threshold: number;
  seniority_months: number;
  frequency_per_month: number;
}
