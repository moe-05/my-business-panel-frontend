export type PromotionTypeName =
  | "percentage_discount"
  | "fixed_amount_discount"
  | "buy_x_get_y"
  | "volume_discount"
  | "tiered_pricing"
  | "combo"
  | "free_shipping";

export interface PromotionType {
  promotion_type_id: number;
  type_name: PromotionTypeName;
}

export interface PromotionRule {
  promotion_rule_id?: string;
  promotion_id?: string;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_percentage?: number | null;
  min_quantity?: number | null;
  max_quantity?: number | null;
  tier_level?: number | null;
  tier_min_quantity?: number | null;
  tier_max_quantity?: number | null;
  tier_price?: number | null;
  tier_discount_percentage?: number | null;
  min_purchase_amount?: number | null;
}

export interface Promotion {
  promotion_id: string;
  tenant_id?: string;
  promotion_name: string;
  promotion_code: string;
  promotion_description?: string | null;
  promotion_type_id?: number;
  type_name: PromotionTypeName;
  customer_segment_id?: number | null;
  segment_name?: string | null;
  promotion_start_date: string;
  promotion_end_date: string;
  is_active: boolean;
  rule?: PromotionRule;
  rules?: PromotionRule[];
  created_at?: string;
  updated_at?: string;
}
