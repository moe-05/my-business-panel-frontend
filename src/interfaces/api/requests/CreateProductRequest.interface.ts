export interface CreateProductRequest {
  tenant_id: string;
  sku: string;
  product_name: string;
  description?: string;
  category_id: string;
  price: number;
  cost_price?: number;
  cabys_code?: string;
  supplier_id?: string;
  giftable?: boolean;
  giftable_from?: number;
  includes_iva?: boolean;
  attribute_value_ids?: string[];
  group_ids?: string[];
}
