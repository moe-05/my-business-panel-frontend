export interface BulkInsertInventoryItem {
  product_variant_id: string;
  stock: number;
  expiration_date?: string;
}

export interface BulkInsertInventoryRequest {
  warehouse_id: string;
  items: BulkInsertInventoryItem[];
}
