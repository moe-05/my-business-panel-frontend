export interface UpdateProductRequest {
  sku?: string;
  variant_name?: string;
  product_name?: string;
  description?: string;
  category_id?: string;
  unit_price?: number;
  cost_price?: number;
  cabys_code?: string;
  supplier_id?: string | null;
  giftable?: boolean;
  giftable_from?: number;
  attribute_value_ids?: string[];
  group_ids?: string[];
}
