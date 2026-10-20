import { pickAmount } from "@/utils/currency";
import type {
  ExpenseAnalyticsData,
  ExpenseAnalyticsRaw,
} from "@/interfaces/entities/FnzExpense.interface";

/**
 * Pasa los analiticos de gastos a la moneda de visualizacion. El backend ya
 * convirtio cada monto con la tasa de la fecha del gasto o de la venta
 * (FNZ-X-02) y devuelve ambas columnas; aqui solo se elige la del toggle.
 */
export function normalizeExpenseAnalytics(
  data: ExpenseAnalyticsRaw,
  targetCurrencyId: number,
): ExpenseAnalyticsData {
  const amount = (row: object, field: string) =>
    String(pickAmount(row, field, targetCurrencyId));

  const categories = (rows: ExpenseAnalyticsRaw["fixedBreakdown"]) =>
    rows
      .map((r) => ({
        category_id: r.category_id,
        category_name: r.category_name,
        account_code: r.account_code,
        total_amount: amount(r, "total"),
      }))
      .sort((a, b) => Number(b.total_amount) - Number(a.total_amount));

  return {
    fixedVsVariable: data.fixedVsVariable.map((r) => ({
      is_fixed: r.is_fixed,
      expense_type: r.expense_type,
      total_amount: amount(r, "total"),
    })),
    fixedBreakdown: categories(data.fixedBreakdown),
    variableBreakdown: categories(data.variableBreakdown),
    salesVsExpenses: data.salesVsExpenses.map((r) => ({
      period: r.period,
      total_sales: amount(r, "total_sales"),
      total_expenses: amount(r, "total_expenses"),
    })),
  };
}
