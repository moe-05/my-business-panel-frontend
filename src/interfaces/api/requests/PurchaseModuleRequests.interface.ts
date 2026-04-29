export interface CreateSupplierRequest {
  supplier_name: string;
  supplier_contact_info: string;
  supplier_address: string;
  supplier_notes?: string;
}

export interface UpdateSupplierRequest {
  supplier_name?: string;
  supplier_contact_info?: string;
  supplier_address?: string;
  supplier_notes?: string;
}

export interface CreatePurchaseOrderItemRequest {
  product_variant_id: string;
  quantity_ordered: number;
  unit_price: number;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  warehouse_id: string;
  expected_delivery_date: string;
  has_invoice?: boolean;
  payment_condition?: "CREDIT" | "IN_FULL";
  items: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchasePaymentRequest {
  purchase_account_payable_id: string;
  amount_paid: number;
  payment_method_id: number;
  payment_reference?: string;
}

export interface UpsertPaymentAlertConfigRequest {
  tenant_id?: string;
  warning_days_before_due: number;
  urgent_days_before_due: number;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
}
