import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { PageHeaderBanner } from "@/components/layout/PageHeaderBanner";
import { IconTrendingUp, IconCreditCard, IconCheckCircle } from "@/assets/icons";

import { financesApi } from "@/api/finances.api";
import { convertCurrency, formatMoney, pickAmount } from "@/utils/currency";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import { DeferredPage } from "@/components/routing/DeferredPage";

import {
  businessDate,
  businessDaysAgo,
  formatDateOnly,
} from "@/utils/businessDate";
import type { CashFlowPageLoaderData } from "@/router/loaders/cashFlow.loaders";
import type {
  CashFlowBucket,
  CashFlowData,
  CashFlowGroupBy,
  CashFlowProjectionItem,
  CashFlowSummaryItem,
  CashFlowAvailableItem,
} from "@/interfaces/entities/CashFlow.interface";
import type { ExchangeRate } from "@/interfaces/entities/ExchangeRate.interface";
import type { Currency } from "@/interfaces/entities/Currency.interface";
import type { Column } from "@/interfaces/components/ui/TableProps.interface";

// ─── helpers ────────────────────────────────────────────────────────────────

function toNum(s: string | number): number {
  return parseFloat(String(s)) || 0;
}

function sumItems(
  items: (CashFlowSummaryItem | CashFlowAvailableItem)[],
  direction: "entrada" | "salida",
  targetCurrencyId: number,
): number {
  return items
    .filter((i) => i.direction === direction)
    .reduce(
      (acc, i) =>
        acc +
        pickAmount(i, "total", targetCurrencyId),
      0,
    );
}

interface BranchFlowRow {
  key: string;
  branch_name: string;
  entradas: number;
  salidas: number;
  neto: number;
  isTotal?: boolean;
}

// Consolidado + una fila por sucursal a partir del resumen del backend, que ya
// trae `branch_id` en cada fila (FNZ-CF-08).
function computeBranchRows(
  summary: CashFlowSummaryItem[],
  branches: { branch_id: string; branch_name: string }[],
  targetCurrencyId: number,
): BranchFlowRow[] {
  const byBranch = new Map<string, { entradas: number; salidas: number }>();
  for (const item of summary) {
    const branchKey = item.branch_id ?? "";
    const acc = byBranch.get(branchKey) ?? { entradas: 0, salidas: 0 };
    const amount = pickAmount(item, "total", targetCurrencyId);
    if (item.direction === "entrada") acc.entradas += amount;
    else acc.salidas += amount;
    byBranch.set(branchKey, acc);
  }

  const rows: BranchFlowRow[] = branches.map((b) => {
    const acc = byBranch.get(b.branch_id) ?? { entradas: 0, salidas: 0 };
    return {
      key: b.branch_id,
      branch_name: b.branch_name,
      entradas: acc.entradas,
      salidas: acc.salidas,
      neto: acc.entradas - acc.salidas,
    };
  });

  // El consolidado suma todo el resumen, aunque una sucursal ya no figure en la lista.
  let entradas = 0;
  let salidas = 0;
  for (const acc of byBranch.values()) {
    entradas += acc.entradas;
    salidas += acc.salidas;
  }
  return [
    {
      key: "consolidado",
      branch_name: "Consolidado",
      entradas,
      salidas,
      neto: entradas - salidas,
      isTotal: true,
    },
    ...rows,
  ];
}

interface BucketChartPoint {
  label: string;
  entradas: number;
  salidas: number;
  neto: number;
}

function formatBucketLabel(dateStr: string, groupBy: CashFlowGroupBy): string {
  const d = new Date(dateStr);
  if (groupBy === "monthly") {
    return d.toLocaleDateString("es-VE", { month: "short", year: "2-digit" });
  }
  if (groupBy === "weekly") {
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
  }
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

function computeChartData(
  buckets: CashFlowBucket[],
  groupBy: CashFlowGroupBy,
  targetCurrencyId: number,
): BucketChartPoint[] {
  const map = new Map<string, { entradas: number; salidas: number }>();

  for (const b of buckets) {
    const key = b.bucket_start;
    const existing = map.get(key) ?? { entradas: 0, salidas: 0 };
    const converted = pickAmount(b, "total", targetCurrencyId);
    if (b.direction === "entrada") {
      existing.entradas += converted;
    } else {
      existing.salidas -= converted;
    }
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketStart, { entradas, salidas }]) => ({
      label: formatBucketLabel(bucketStart, groupBy),
      entradas,
      salidas,
      neto: entradas + salidas,
    }));
}

interface DeficitPeriod {
  label: string;
  neto: number;
}

function detectDeficits(points: BucketChartPoint[]): DeficitPeriod[] {
  return points
    .filter((p) => p.neto < 0)
    .map((p) => ({ label: p.label, neto: p.neto }));
}

const GROUP_BY_OPTIONS: { value: CashFlowGroupBy; label: string }[] = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ventas: "Ventas",
  cuentas_cobradas: "Cuentas cobradas",
  pagos_proveedores: "Pagos a proveedores",
  nomina: "Nomina",
  gastos_operativos: "Gastos operativos",
  devoluciones: "Devoluciones",
  cuentas_por_cobrar: "Cuentas por cobrar",
  cuentas_por_pagar: "Cuentas por pagar",
};

function movementLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

function fmt(
  value: number,
  currency: Currency | undefined,
): string {
  return formatMoney(
    value,
    currency?.currency_code ?? "VES",
    currency?.symbol ?? "Bs.",
  );
}

// ─── componentes internos ────────────────────────────────────────────────────

function TrendChart({
  points,
  currency,
}: {
  points: BucketChartPoint[];
  currency: Currency | undefined;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Sin datos en el periodo seleccionado
      </div>
    );
  }
  const symbol = currency?.symbol ?? "Bs.";
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#9ca3af"
          tickFormatter={(v: number) => `${symbol}${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(v, name) => [
            fmt(Math.abs(Number(v)), currency),
            String(name),
          ]}
          labelStyle={{ color: "#374151" }}
        />
        <Legend />
        <Bar dataKey="entradas" name="Entradas" fill="#22c55e" opacity={0.85} />
        <Bar dataKey="salidas" name="Salidas" fill="#ef4444" opacity={0.85} />
        <Line
          type="monotone"
          dataKey="neto"
          name="Flujo neto"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ProjectionsTable({
  projections,
  currency,
  rates,
  targetCurrencyId,
}: {
  projections: CashFlowProjectionItem[];
  currency: Currency | undefined;
  rates: ExchangeRate[];
  targetCurrencyId: number;
}) {
  const columns: Column[] = [
    {
      key: "projection_date",
      label: "Fecha",
      width: "16%",
      // Las proyecciones incluyen lo vencido y lo que vence hoy: son los pagos
      // mas urgentes, se marcan en vez de ocultarse.
      render: (value, row: CashFlowProjectionItem) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-gray-600">
            {/* projection_date viene de columnas date (due_date, period_end) */}
            {formatDateOnly(value as string)}
          </span>
          {row.is_overdue && (
            <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              Vencida
            </span>
          )}
        </span>
      ),
    },
    {
      key: "movement_type",
      label: "Tipo",
      width: "22%",
      render: (value, row: CashFlowProjectionItem) => (
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            row.direction === "salida"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700",
          ].join(" ")}
        >
          {movementLabel(value as string)}
        </span>
      ),
    },
    {
      key: "description",
      label: "Descripcion",
      width: "38%",
      render: (value) => <span className="text-gray-700">{value as string}</span>,
    },
    {
      key: "amount",
      label: "Monto",
      width: "24%",
      align: "right",
      // Pagos futuros/pendientes: a la tasa de hoy (no tienen fecha historica).
      render: (value, row: CashFlowProjectionItem) => {
        const converted = convertCurrency(
          toNum(value as string),
          Number(row.currency_id),
          targetCurrencyId,
          rates,
        );
        const isOutflow = row.direction === "salida";
        return (
          <span
            className={
              isOutflow
                ? "font-medium text-red-600"
                : "font-medium text-green-600"
            }
          >
            {isOutflow ? "-" : "+"}
            {fmt(converted, currency)}
          </span>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={projections}
      emptyMessage="Sin pagos ni cobros proximos registrados"
    />
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export function CashFlowPage() {
  const { data } = useLoaderData() as { data: Promise<CashFlowPageLoaderData> };

  return (
    <DeferredPage resolve={data}>
      {(resolved) => <CashFlowPageContent {...resolved} />}
    </DeferredPage>
  );
}

function CashFlowPageContent({
  cashFlow: initialCashFlow,
  projections,
  currencies,
  exchangeRates,
  branches,
}: CashFlowPageLoaderData) {
  const [cashFlow, setCashFlow] = useState<CashFlowData>(initialCashFlow);
  const [groupBy, setGroupBy] = useState<CashFlowGroupBy>(
    initialCashFlow.group_by ?? "daily",
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    initialCashFlow.start_date || businessDaysAgo(30),
  );
  const [endDate, setEndDate] = useState<string>(
    initialCashFlow.end_date || businessDate(),
  );
  // Moneda visualizada: toggle universal del header (ver CurrencyContext),
  // no un selector local -- default USD.
  const { displayCurrencyId: selectedCurrencyId } = useDisplayCurrency();
  const [loading, setLoading] = useState(false);

  const currency = currencies.find(
    (c) => Number(c.currency_id) === selectedCurrencyId,
  );

  async function fetchData(params: {
    startDate: string;
    endDate: string;
    groupBy: CashFlowGroupBy;
    branchId?: string;
  }) {
    setLoading(true);
    try {
      const data = await financesApi.getCashFlow({
        ...params,
        branchId: params.branchId || undefined,
      });
      setCashFlow(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleGroupByChange(value: string) {
    const next = value as CashFlowGroupBy;
    setGroupBy(next);
    await fetchData({
      startDate,
      endDate,
      groupBy: next,
      branchId: selectedBranchId,
    });
  }

  async function handleDateChange(
    field: "startDate" | "endDate",
    value: string,
  ) {
    const nextStart = field === "startDate" ? value : startDate;
    const nextEnd = field === "endDate" ? value : endDate;
    if (field === "startDate") setStartDate(value);
    else setEndDate(value);
    await fetchData({
      startDate: nextStart,
      endDate: nextEnd,
      groupBy,
      branchId: selectedBranchId,
    });
  }

  async function handleBranchChange(value: string) {
    setSelectedBranchId(value);
    await fetchData({ startDate, endDate, groupBy, branchId: value });
  }

  // KPI cards
  const totalInflows = useMemo(
    () => sumItems(cashFlow.summary, "entrada", selectedCurrencyId),
    [cashFlow.summary, selectedCurrencyId],
  );
  const totalOutflows = useMemo(
    () => sumItems(cashFlow.summary, "salida", selectedCurrencyId),
    [cashFlow.summary, selectedCurrencyId],
  );
  const netFlow = totalInflows - totalOutflows;

  // Consolidado + desglose tienda por tienda (solo sin filtro de sucursal).
  const branchRows = useMemo(
    () => computeBranchRows(cashFlow.summary, branches, selectedCurrencyId),
    [cashFlow.summary, branches, selectedCurrencyId],
  );
  const showBranchBreakdown = selectedBranchId === "" && branches.length > 1;

  const availableInflows = useMemo(
    () =>
      sumItems(cashFlow.available_cash, "entrada", selectedCurrencyId),
    [cashFlow.available_cash, selectedCurrencyId],
  );
  const availableOutflows = useMemo(
    () =>
      sumItems(cashFlow.available_cash, "salida", selectedCurrencyId),
    [cashFlow.available_cash, selectedCurrencyId],
  );
  const availableCash = availableInflows - availableOutflows;

  // Chart
  const chartPoints = useMemo(
    () =>
      computeChartData(cashFlow.buckets, groupBy, selectedCurrencyId),
    [cashFlow.buckets, groupBy, selectedCurrencyId],
  );

  const deficits = useMemo(() => detectDeficits(chartPoints), [chartPoints]);

  // Breakdown table (period summary by movement type)
  const breakdownRows = useMemo(() => {
    const byType = new Map<
      string,
      { direction: string; amount: number }
    >();
    for (const item of cashFlow.summary) {
      const key = `${item.direction}:${item.movement_type}`;
      const existing = byType.get(key) ?? {
        direction: item.direction,
        amount: 0,
      };
      existing.amount += pickAmount(item, "total", selectedCurrencyId);
      byType.set(key, existing);
    }
    return Array.from(byType.entries()).map(([key, val]) => ({
      key,
      movement_type: key.split(":")[1],
      direction: val.direction as "entrada" | "salida",
      amount: val.amount,
    }));
  }, [cashFlow.summary, selectedCurrencyId]);

  const sortedBreakdownRows = useMemo(
    () => [...breakdownRows].sort((a, b) => b.amount - a.amount),
    [breakdownRows],
  );

  const breakdownColumns: Column[] = [
    {
      key: "movement_type",
      label: "Tipo de movimiento",
      width: "40%",
      render: (value) => <span className="text-gray-700">{movementLabel(value as string)}</span>,
    },
    {
      key: "direction",
      label: "Direccion",
      width: "30%",
      render: (value) => (
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            value === "salida"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700",
          ].join(" ")}
        >
          {value === "salida" ? "Salida" : "Entrada"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Total",
      width: "30%",
      align: "right",
      render: (value, row: { direction: "entrada" | "salida"; amount: number }) => (
        <span
          className={
            row.direction === "salida"
              ? "font-medium text-red-600"
              : "font-medium text-green-600"
          }
        >
          {fmt(value as number, currency)}
        </span>
      ),
    },
  ];

  const branchColumns: Column[] = [
    {
      key: "branch_name",
      label: "Sucursal",
      width: "34%",
      render: (value, row: BranchFlowRow) => (
        <span
          className={row.isTotal ? "font-semibold text-gray-900" : "text-gray-700"}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "entradas",
      label: "Entradas",
      width: "22%",
      align: "right",
      render: (value) => (
        <span className="font-medium text-green-600">
          {fmt(value as number, currency)}
        </span>
      ),
    },
    {
      key: "salidas",
      label: "Salidas",
      width: "22%",
      align: "right",
      render: (value) => (
        <span className="font-medium text-red-600">
          {fmt(value as number, currency)}
        </span>
      ),
    },
    {
      key: "neto",
      label: "Flujo neto",
      width: "22%",
      align: "right",
      render: (value, row: BranchFlowRow) => (
        <span
          className={[
            row.isTotal ? "font-semibold" : "font-medium",
            (value as number) >= 0 ? "text-green-700" : "text-red-700",
          ].join(" ")}
        >
          {fmt(value as number, currency)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeaderBanner
        eyebrow="Finanzas"
        title="Flujo de Caja"
        description="Movimiento real de efectivo: entradas, salidas, flujo neto y proyecciones futuras del negocio."
      />

      {/* Filtros */}
      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Desde</p>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => void handleDateChange("startDate", e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent-300"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Hasta</p>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => void handleDateChange("endDate", e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent-300"
          />
        </div>
        <div className="w-44">
          <p className="mb-1.5 text-sm font-medium text-gray-700">Agrupacion</p>
          <Select
            value={groupBy}
            onChange={(e) => void handleGroupByChange(e.target.value)}
            options={GROUP_BY_OPTIONS}
          />
        </div>
        {branches.length > 1 && (
          <div className="w-56">
            <p className="mb-1.5 text-sm font-medium text-gray-700">Sucursal</p>
            <Select
              value={selectedBranchId}
              onChange={(e) => void handleBranchChange(e.target.value)}
              options={[
                { value: "", label: "Todas las sucursales" },
                ...branches.map((b) => ({
                  value: b.branch_id,
                  label: b.branch_name,
                })),
              ]}
            />
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-200 border-t-accent-500" />
            Actualizando...
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total entradas"
          value={fmt(totalInflows, currency)}
          icon={<IconTrendingUp />}
          sublabel="Ingresos del periodo"
        />
        <StatCard
          label="Total salidas"
          value={fmt(totalOutflows, currency)}
          icon={<IconCreditCard />}
          sublabel="Egresos del periodo"
        />
        <StatCard
          label="Flujo de caja neto"
          value={fmt(netFlow, currency)}
          icon={<IconCreditCard />}
          sublabel="Entradas menos salidas"
          accent={netFlow >= 0}
        />
        <StatCard
          label="Neto acumulado"
          value={fmt(availableCash, currency)}
          icon={<IconCheckCircle />}
          sublabel={
            selectedBranchId
              ? "Entradas menos salidas historicas de la sucursal"
              : "Entradas menos salidas historicas, sin saldo inicial de caja"
          }
        />
      </section>

      {/* Consolidado y desglose por sucursal */}
      {showBranchBreakdown && (
        <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Flujo por sucursal
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Consolidado del negocio y flujo de cada tienda en el periodo.
          </p>
          <Table
            columns={branchColumns}
            data={branchRows}
            emptyMessage="Sin sucursales"
          />
        </section>
      )}

      {/* Tendencia */}
      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Tendencia del flujo de caja
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Entradas (verde), salidas (rojo) y flujo neto (azul) por periodo.
        </p>
        <TrendChart points={chartPoints} currency={currency} />
      </section>

      {/* Desglose por tipo de movimiento */}
      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Desglose del periodo
        </h2>
        <Table
          columns={breakdownColumns}
          data={sortedBreakdownRows}
          emptyMessage="Sin movimientos en el periodo"
        />
      </section>

      {/* Deficits detectados */}
      {deficits.length > 0 && (
        <section className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="mb-1 text-base font-semibold text-red-800">
            Deficits de caja detectados
          </h2>
          <p className="mb-4 text-sm text-red-600">
            Periodos en los que los egresos superaron los ingresos.
          </p>
          <div className="flex flex-wrap gap-2">
            {deficits.map((d) => (
              <div
                key={d.label}
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-red-700">{d.label}</span>
                <span className="ml-2 text-red-500">
                  {fmt(d.neto, currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Proyecciones y pagos proximos */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Proyecciones y pagos proximos
            </h2>
            <p className="text-sm text-gray-500">
              Movimientos futuros conocidos: CxC, CxP y nomina pendiente.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              Entradas
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              Salidas
            </span>
          </div>
        </div>
        <ProjectionsTable
          projections={projections.projections}
          currency={currency}
          rates={exchangeRates}
          targetCurrencyId={selectedCurrencyId}
        />
      </section>
    </div>
  );
}
