export interface RoyaltyOption {
  royalty_option_id: string;
  royalty_rule_id: string;
  tenant_product_group_id: string;
  tenant_product_group_type_id: string;
  group_name: string;
  parent_group_id: string | null;
  hierarchy_level: number;
  quantity: number;
}

export interface RoyaltyRuleDimension {
  tenant_product_group_type_id: string;
  type_name: string;
}

export interface RoyaltyRule {
  royalty_rule_id: string;
  tenant_id: string;
  min_amount: number;
  created_at: string;
  updated_at: string;
  dimensions: RoyaltyRuleDimension[];
  options: RoyaltyOption[];
}

export interface ApplicableRoyaltyRule extends RoyaltyRule {
  multiplier: number;
}

export interface GiftableProduct {
  product_variant_id: string;
  variant_name: string;
  sku: string;
  unit_price: number;
  giftable_from?: number | null;
}
