import { url } from ".";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { Expense, ExpenseType } from "@/interfaces/entities/PosExpense.interface";

const json = async <T>(res: Response, fallback: string): Promise<T> => {
  const body = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? body?.error ?? fallback);
    throw new Error(msg);
  }
  return (body as ApiResponse<T>).data;
};

export const posExpenseApi = {
  async listTypes(tenantId: string): Promise<ExpenseType[]> {
    const res = await fetch(`${url}/pos-expense/types/${tenantId}`, {
      credentials: "include",
    });
    return json<ExpenseType[]>(res, "Error al listar tipos de gasto");
  },

  async createType(data: {
    tenant_id: string;
    expense_type_name: string;
    expense_type_detail?: string;
  }): Promise<ExpenseType> {
    const res = await fetch(`${url}/pos-expense/types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return json<ExpenseType>(res, "Error al crear tipo de gasto");
  },

  async listByBranch(branchId: string): Promise<Expense[]> {
    const res = await fetch(`${url}/pos-expense/branch/${branchId}`, {
      credentials: "include",
    });
    return json<Expense[]>(res, "Error al listar gastos");
  },

  async create(data: {
    expense_type_id: string;
    expense_amount: number;
    branch_id: string;
  }): Promise<Expense> {
    const res = await fetch(`${url}/pos-expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return json<Expense>(res, "Error al registrar gasto");
  },

  async updateStatus(
    expenseId: string,
    status: "approved" | "rejected" | "cancelled",
    rejection_reason?: string,
  ): Promise<Expense> {
    const res = await fetch(`${url}/pos-expense/${expenseId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, rejection_reason }),
    });
    return json<Expense>(res, "Error al actualizar estado del gasto");
  },
};
