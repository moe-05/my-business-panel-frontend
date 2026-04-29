export interface UpdateProductRequest {
  product_name?: string;
  description?: string;
  category_id?: string;
  price?: number;
  cabys_code?: string;
  attribute_value_ids?: string[];
  group_ids?: string[];
}
