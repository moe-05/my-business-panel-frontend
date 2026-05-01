import type {
  PromotionRule,
  PromotionTargetInput,
} from "@/interfaces/entities/Promotion.interface";

export interface CreatePromotionRequest {
  tenant_id: string;
  promotion_name: string;
  promotion_code: string;
  promotion_description?: string;
  promotion_type_id: number;
  customer_segment_id: number;
  promotion_start_date: string;
  promotion_end_date: string;
  is_active: boolean;
  is_default?: boolean;
  is_stackable?: boolean;
  rules: PromotionRule;
  targets?: PromotionTargetInput[];
}
