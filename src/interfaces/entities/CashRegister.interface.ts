export interface CashRegister {
  cash_register_id: string;
  branch_id: string;
  register_name: string;
  is_active: boolean;
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
}
