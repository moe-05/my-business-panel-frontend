export interface CompositionComponent {
  parent_product_variant_id: string;
  child_product_variant_id: string;
  quantity: number;
  child_sku?: string;
  child_variant_name?: string;
  child_is_composite?: boolean;
}

export interface CompositionParent {
  parent_product_variant_id: string;
  child_product_variant_id: string;
  quantity: number;
  parent_sku?: string;
  parent_variant_name?: string;
}

export interface CompositionAvailability {
  available: number;
}
