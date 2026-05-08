export interface ExpenseType {
  expense_type_id: string;
  tenant_id: string;
  expense_type_name: string;
  expense_type_detail?: string | null;
  created_at: string;
}

export interface Expense {
  expense_id: string;
  expense_type_id: string;
  expense_type_name: string;
  expense_amount: number;
  branch_id: string;
  user_id: string;
  user_email?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejection_reason?: string | null;
  created_at: string;
}
