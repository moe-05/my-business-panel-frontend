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
  cash_sales_amount?: number | null;
  debit_sales_amount?: number | null;
  credit_sales_amount?: number | null;
  transfer_sales_amount?: number | null;
  points_sales_amount?: number | null;
  total_sales_amount?: number | null;
  mismatch?: boolean | null;
  mismatch_amount?: number | null;
  mismatch_type?: "surplus" | "shortage" | null;
}

export interface SessionGroupSale {
  tenant_product_group_id: string;
  group_name: string;
  total_amount: number;
}
