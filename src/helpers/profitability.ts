import { pickAmount } from "@/utils/currency";
import type {
  BranchProfitability,
  BucketUnit,
  ExpenseCategoryBreakdown,
  ProfitabilityPoint,
  ProfitabilityRawData,
  ProfitabilityResult,
  ProfitabilitySeries,
} from "@/interfaces/entities/Profitability.interface";

const UNCATEGORIZED_LABEL = "Sin categoria";

// Acumulador de gastos por categoria (clave = category_id o "uncategorized").
interface CategoryAccumulator {
  category_id: string | null;
  category_name: string;
  amount: number;
}

function addToCategoryMap(
  map: Map<string, CategoryAccumulator>,
  categoryId: string | null,
  categoryName: string | null,
  amount: number,
) {
  const key = categoryId ?? "uncategorized";
  const existing = map.get(key);
  if (existing) {
    existing.amount += amount;
  } else {
    map.set(key, {
      category_id: categoryId,
      category_name: categoryName ?? UNCATEGORIZED_LABEL,
      amount,
    });
  }
}

function breakdownFromMap(
  map: Map<string, CategoryAccumulator>,
): ExpenseCategoryBreakdown[] {
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

// Componentes monetarios acumulados de un (sucursal, bucket), ya en moneda destino.
interface BucketAccumulator {
  net_sales: number;
  discounts: number;
  cogs: number;
  returns: number;
  returns_cogs: number;
  notes: number;
  expenses: number;
  payroll: number;
}

function emptyAccumulator(): BucketAccumulator {
  return {
    net_sales: 0,
    discounts: 0,
    cogs: 0,
    returns: 0,
    returns_cogs: 0,
    notes: 0,
    expenses: 0,
    payroll: 0,
  };
}

// Etiqueta del eje X segun el paso del bucket.
function formatBucketLabel(iso: string, unit: BucketUnit): string {
  const d = new Date(iso);
  switch (unit) {
    case "hour":
      return d.toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "month":
      return d.toLocaleDateString("es-VE", {
        month: "short",
        year: "2-digit",
      });
    default: // day | week
      return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
  }
}

// Aplica las formulas de rentabilidad a un acumulador.
//   VN = ventas netas - devoluciones + notas (credito negativas, debito positivas)
//   UB = (ventas netas - cogs) - (devoluciones - cogs devuelto) + notas
//   UN = UB - gastos - nomina
//   MB = UB / VN * 100 ; MN = UN / VN * 100
function computePoint(
  bucketStart: string,
  unit: BucketUnit,
  acc: BucketAccumulator,
): ProfitabilityPoint {
  const vn = acc.net_sales - acc.returns + acc.notes;
  const ub =
    acc.net_sales - acc.cogs - (acc.returns - acc.returns_cogs) + acc.notes;
  const un = ub - acc.expenses - acc.payroll;
  return {
    bucket_start: bucketStart,
    label: formatBucketLabel(bucketStart, unit),
    vn,
    ub,
    un,
    mb_pct: vn > 0 ? (ub / vn) * 100 : 0,
    mn_pct: vn > 0 ? (un / vn) * 100 : 0,
  };
}

function seriesFromBuckets(
  buckets: Map<string, BucketAccumulator>,
  unit: BucketUnit,
  expenseBreakdown: ExpenseCategoryBreakdown[],
): ProfitabilitySeries {
  const accs = Array.from(buckets.values());
  const points = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketStart, acc]) => computePoint(bucketStart, unit, acc));

  return {
    points,
    total_vn: points.reduce((s, p) => s + p.vn, 0),
    total_ub: points.reduce((s, p) => s + p.ub, 0),
    total_un: points.reduce((s, p) => s + p.un, 0),
    total_payroll: accs.reduce((s, a) => s + a.payroll, 0),
    expense_breakdown: expenseBreakdown,
  };
}

// Pipeline puro: data cruda + moneda destino + tasas -> series para los graficos.
export function computeProfitability(
  raw: ProfitabilityRawData,
  targetCurrencyId: number,
): ProfitabilityResult {
  const unit = raw.bucket_unit;

  // Acumuladores por sucursal -> por bucket. Y un acumulador general por bucket.
  const byBranch = new Map<string, Map<string, BucketAccumulator>>();
  const general = new Map<string, BucketAccumulator>();

  const branchBucket = (branchId: string, bucket: string): BucketAccumulator => {
    let buckets = byBranch.get(branchId);
    if (!buckets) {
      buckets = new Map();
      byBranch.set(branchId, buckets);
    }
    let acc = buckets.get(bucket);
    if (!acc) {
      acc = emptyAccumulator();
      buckets.set(bucket, acc);
    }
    return acc;
  };

  const generalBucket = (bucket: string): BucketAccumulator => {
    let acc = general.get(bucket);
    if (!acc) {
      acc = emptyAccumulator();
      general.set(bucket, acc);
    }
    return acc;
  };

  // El backend ya convirtio cada monto con la tasa de su fecha (FNZ-X-02):
  // solo se elige la columna _usd o _ves.
  const pick = (row: object, field: string) =>
    pickAmount(row, field, targetCurrencyId);

  for (const row of raw.sales) {
    const netSales = pick(row, "net_sales");
    const discounts = pick(row, "discounts");
    const cogs = pick(row, "cogs");
    for (const acc of [
      branchBucket(row.branch_id, row.bucket_start),
      generalBucket(row.bucket_start),
    ]) {
      acc.net_sales += netSales;
      acc.discounts += discounts;
      acc.cogs += cogs;
    }
  }

  for (const row of raw.returns) {
    const returns = pick(row, "returns");
    const returnsCogs = pick(row, "returns_cogs");
    for (const acc of [
      branchBucket(row.branch_id, row.bucket_start),
      generalBucket(row.bucket_start),
    ]) {
      acc.returns += returns;
      acc.returns_cogs += returnsCogs;
    }
  }

  // Notas de credito / debito: ajustan las ventas netas del periodo en que se emiten.
  for (const row of raw.notes ?? []) {
    const notes = pick(row, "notes");
    for (const acc of [
      branchBucket(row.branch_id, row.bucket_start),
      generalBucket(row.bucket_start),
    ]) {
      acc.notes += notes;
    }
  }

  for (const row of raw.expenses) {
    const expenses = pick(row, "amount");
    for (const acc of [
      branchBucket(row.branch_id, row.bucket_start),
      generalBucket(row.bucket_start),
    ]) {
      acc.expenses += expenses;
    }
  }

  // Nomina pagada: se resta en la UN y se muestra aparte de los gastos.
  for (const row of raw.payroll ?? []) {
    const payroll = pick(row, "amount");
    for (const acc of [
      branchBucket(row.branch_id, row.bucket_start),
      generalBucket(row.bucket_start),
    ]) {
      acc.payroll += payroll;
    }
  }

  // Desglose de gastos por categoria, acumulado sobre todo el periodo
  // (no por bucket) -- se muestra como tabla/lista debajo de cada grafica.
  const byBranchCategory = new Map<string, Map<string, CategoryAccumulator>>();
  const generalCategory = new Map<string, CategoryAccumulator>();

  for (const row of raw.expense_categories) {
    const amount = pick(row, "amount");

    let branchMap = byBranchCategory.get(row.branch_id);
    if (!branchMap) {
      branchMap = new Map();
      byBranchCategory.set(row.branch_id, branchMap);
    }
    addToCategoryMap(branchMap, row.category_id, row.category_name, amount);
    addToCategoryMap(generalCategory, row.category_id, row.category_name, amount);
  }

  const generalSeries = seriesFromBuckets(
    general,
    unit,
    breakdownFromMap(generalCategory),
  );
  const tenantUn = generalSeries.total_un;

  // Una serie por sucursal (incluye sedes sin ventas -> serie vacia).
  const branches: BranchProfitability[] = raw.branches.map((b) => {
    const buckets = byBranch.get(b.branch_id) ?? new Map();
    const categoryMap = byBranchCategory.get(b.branch_id) ?? new Map();
    const series = seriesFromBuckets(buckets, unit, breakdownFromMap(categoryMap));
    return {
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      ...series,
      // Divisor en valor absoluto: con UN consolidada negativa, una sucursal con
      // ganancia no debe mostrar un aporte negativo.
      contribution_pct:
        tenantUn !== 0 ? (series.total_un / Math.abs(tenantUn)) * 100 : 0,
    };
  });

  return { general: generalSeries, branches };
}
