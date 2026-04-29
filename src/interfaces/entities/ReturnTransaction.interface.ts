export interface ReturnProductPayload {
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_item_id: string;
}

export interface ReturnTransaction {
  return_transaction_id: string;
  digital_sale_invoice_id: string | null;
  electronic_sale_invoice_id: string | null;
  tenant_customer_id: string;
  total_refund_amount: number;
  refund_method: number;
  return_status_id: number;
  return_date: string;
}
