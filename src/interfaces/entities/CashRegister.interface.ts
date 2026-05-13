export interface CashRegister {
  cash_register_id: string;
  branch_id: string;
  register_name: string;
  is_active: boolean;
  /** Plain-text key required for non-admin open/close. Null = no key. */
  cash_register_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterSession {
  cash_register_session_id: string;
  cash_register_id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  closing_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  register_name?: string;
  branch_id?: string;
  branch_name?: string;
  tenant_id?: string;
  user_first_name?: string;
  user_last_name?: string;
  // Shift-report fields (populated on close)
  cash_sales_amount: number | string;
  debit_sales_amount: number | string;
  credit_sales_amount: number | string;
  transfer_sales_amount: number | string;
  points_sales_amount: number | string;

  user_cash_amount?: number | string;
  user_debit_amount?: number | string;
  user_credit_amount?: number | string;
  user_transfer_amount?: number | string;

  total_sales_amount: number | string;
  mismatch?: boolean | null;
  mismatch_amount?: number | null;
  mismatch_type?: "surplus" | "shortage" | null;
  payment_method_sales?: SessionPaymentMethodSale[];
}

export interface SessionGroupSale {
  tenant_product_group_id: string;
  group_name: string;
  total_amount: number;
}

export interface SessionPaymentMethodSale {
  payment_method_id: number;
  payment_method_name: string;
  total_amount: number;
}
