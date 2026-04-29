export interface RefundSale {
  sale_id: string;
  tenant_customer_id: string | null;
  sale_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  has_electronic_invoice: boolean;
  is_completed: boolean;
  branch_id: string;
  branch_name: string | null;
  tenant_id: string;
  currency_code: string | null;
  currency_symbol: string | null;
}

export interface RefundCustomer {
  tenant_customer_id: string;
  first_name: string | null;
  last_name: string | null;
  document_number: string | null;
  email: string | null;
}

export interface RefundDigitalInvoice {
  digital_sale_invoice_id: string;
  invoice_number: string | null;
  invoiced_at: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface RefundElectronicInvoice {
  electronic_sale_invoice_id: string;
  key_number: string | null;
  consecutive_number: string | null;
  status_id: number | null;
  created_at: string | null;
}

export interface RefundItem {
  sale_item_id: string;
  product_variant_id: string;
  sku: string | null;
  variant_name: string | null;
  available_quantity: number;
  unit_price: number;
  total_price: number;
  digital_sale_invoice_item_id: string | null;
  electronic_sale_invoice_item_id: string | null;
}

export interface SaleRefundContext {
  sale: RefundSale;
  customer: RefundCustomer | null;
  digital_invoice: RefundDigitalInvoice | null;
  electronic_invoice: RefundElectronicInvoice | null;
  items: RefundItem[];
}
