export interface SaleCondition {
  condition_code: string;
  condition_desc: string;
}

export interface SaleListItem {
  sale_id: string;
  sale_date: string;
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  is_completed: boolean;
  branch_id: string;
  branch_name: string;
  currency_code: string;
  symbol: string;
  has_electronic_invoice?: boolean;
  is_refunded?: boolean;
  tenant_customer_id?: string;
  created_at?: string;
  return_transaction_id?: string | null;
}

export interface SaleItemPayload {
  tenant_id: string;
  product_variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_price_type?: "NORMAL" | "PROMO" | "SEGMENT" | "MANUAL";
  promotion_id?: string;
  original_price?: number;
  discount_applied?: number;
}

export interface SalePaymentPayload {
  /** Optional: walk-in / anonymous sales record payments without a customer. */
  tenant_customer_id?: string | null;
  payment_method_id: number;
  is_points_redemption: boolean;
  points_redeemed: number;
  points_to_currency_rate: number;
  payment_amount: number;
  payment_date: string;
  currency_id: number;
  verified: boolean;
}

export interface CreateSaleResult {
  saleId: string;
  eInvoiceWarning?: string;
}

export interface DigitalInvoiceInfo {
  digital_sale_invoice_id: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  points_accumulated: number;
  ad_message: string | null;
  due_date: string | null;
  invoiced_at: string;
  /** Null for walk-in/anonymous sales */
  first_name: string | null;
  last_name: string | null;
  document_number: string | null;
  email: string | null;
  tenant_name: string | null;
}

export interface SaleItemDetail {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ElectronicInvoiceInfo {
  electronic_sale_invoice_id: string;
  sale_id: string;
  key_number: string;
  consecutive_number: string;
  status_id: number;
  hacienda_response_xml?: string | null;
  hacienda_response_date?: string | null;
  created_at: string;
  updated_at?: string;
}
