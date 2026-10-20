// Tipos de la Vista de Rentabilidad.
// El backend devuelve componentes crudos; el pipeline del frontend calcula margenes.

export type ProfitabilityInterval =
  | "24h"
  | "7d"
  | "15d"
  | "30d"
  | "90d"
  | "180d"
  | "365d";

export type BucketUnit = "hour" | "day" | "week" | "month";

export interface BranchRef {
  branch_id: string;
  branch_name: string;
}

// Todos los montos llegan en USD y VES (<campo>_usd / <campo>_ves), convertidos
// por el backend con la tasa de la fecha de cada movimiento (FNZ-X-02).
export interface SalesComponentRow {
  branch_id: string;
  bucket_start: string;
  net_sales_usd: string; // neto de descuento
  net_sales_ves: string;
  discounts_usd: string;
  discounts_ves: string;
  cogs_usd: string; // costo de ventas (catalogo en USD)
  cogs_ves: string;
}

export interface ReturnsComponentRow {
  branch_id: string;
  bucket_start: string;
  returns_usd: string;
  returns_ves: string;
  returns_cogs_usd: string;
  returns_cogs_ves: string;
}

export interface ExpenseComponentRow {
  branch_id: string;
  bucket_start: string;
  amount_usd: string;
  amount_ves: string;
}

export interface ExpenseCategoryComponentRow {
  branch_id: string;
  bucket_start: string;
  category_id: string | null;
  category_name: string | null; // null = sin categoria asignada
  amount_usd: string;
  amount_ves: string;
}

// Nomina pagada (planillas cerradas).
export interface PayrollComponentRow {
  branch_id: string;
  bucket_start: string;
  amount_usd: string;
  amount_ves: string;
}

// Notas de credito (negativas) y debito (positivas) activas, netas de IVA.
export interface NotesComponentRow {
  branch_id: string;
  bucket_start: string;
  notes_usd: string;
  notes_ves: string;
}

// Respuesta cruda del endpoint GET /finances/profitability.
export interface ProfitabilityRawData {
  interval: ProfitabilityInterval;
  range_start: string;
  bucket_unit: BucketUnit;
  branches: BranchRef[];
  sales: SalesComponentRow[];
  returns: ReturnsComponentRow[];
  expenses: ExpenseComponentRow[];
  expense_categories: ExpenseCategoryComponentRow[];
  payroll: PayrollComponentRow[];
  notes: NotesComponentRow[];
}

// Desglose de gastos por categoria en el periodo, ya en moneda destino.
export interface ExpenseCategoryBreakdown {
  category_id: string | null;
  category_name: string;
  amount: number;
}

// ─── Tipos computados (salida del pipeline) ─────────────────────────────────

export interface ProfitabilityPoint {
  bucket_start: string;
  label: string; // etiqueta del eje X
  vn: number; // ventas netas
  ub: number; // utilidad bruta
  un: number; // utilidad neta
  mb_pct: number; // margen bruto %
  mn_pct: number; // margen neto %
}

export interface ProfitabilitySeries {
  points: ProfitabilityPoint[];
  total_vn: number;
  total_ub: number;
  total_un: number;
  /** Nomina restada en la UN, como linea separada de los gastos. */
  total_payroll: number;
  expense_breakdown: ExpenseCategoryBreakdown[];
}

export interface BranchProfitability extends ProfitabilitySeries {
  branch_id: string;
  branch_name: string;
  contribution_pct: number; // aporte de sucursal (AS%)
}

export interface ProfitabilityResult {
  general: ProfitabilitySeries;
  branches: BranchProfitability[];
}
