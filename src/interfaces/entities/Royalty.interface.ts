export interface RoyaltyOptionProduct {
  royalty_option_product_id: string;
  royalty_option_id: string;
  product_variant_id: string;
  variant_name: string;
  sku: string;
  unit_price?: number;
}

export interface RoyaltyOption {
  royalty_option_id: string;
  royalty_rule_id: string;
  tenant_product_group_id: string;
  group_name: string;
  quantity: number;
  scope: "any" | "specific";
  products: RoyaltyOptionProduct[];
}

export interface RoyaltyRule {
  royalty_rule_id: string;
  tenant_id: string;
  tenant_product_group_type_id?: string;
  min_amount: number;
  created_at: string;
  updated_at: string;
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
