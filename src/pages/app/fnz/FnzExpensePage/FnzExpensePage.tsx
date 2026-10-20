import { useState, useEffect, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { financesApi } from "@/api/finances.api";
import {
  TimeIntervalSelector,
  intervalToDates,
} from "@/components/ui/TimeIntervalSelector";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { ExpenseDistributionChart } from "./components/ExpenseDistributionChart";
import { ExpenseBreakdownChart } from "./components/ExpenseBreakdownChart";
import { SalesVsExpensesChart } from "./components/SalesVsExpensesChart";
import { ExpenseRegistrationForm } from "./components/ExpenseRegistrationForm";
import { CategoryManagementPanel } from "./components/CategoryManagementPanel";
import { ExpenseHistoryTable } from "@/components/finances/ExpenseHistoryTable";
import { PageHeaderBanner } from "@/components/layout/PageHeaderBanner";
import { formatInCurrency } from "@/utils/purchase";
import { pickAmount } from "@/utils/currency";
import { normalizeExpenseAnalytics } from "@/helpers/fnzExpenseAnalytics";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import { DeferredPage } from "@/components/routing/DeferredPage";

import type { TimeInterval } from "@/components/ui/TimeIntervalSelector";
import type {
  ExpenseAnalyticsRaw,
  PayrollAnalytic,
} from "@/interfaces/entities/FnzExpense.interface";
import type { FnzExpensePageLoaderData } from "@/router/loaders/fnzExpense.loaders";
import type { Currency } from "@/interfaces/entities/Currency.interface";


export function FnzExpensePage() {
  const { data } = useLoaderData() as {
    data: Promise<FnzExpensePageLoaderData>;
  };

  return (
    <DeferredPage resolve={data}>
      {(resolved) => <FnzExpensePageContent {...resolved} />}
    </DeferredPage>
  );
}

function FnzExpensePageContent({
  tenantId,
  branches,
  categories,
  currencies,
  exchangeRates,
}: FnzExpensePageLoaderData) {
  const { user } = useAuth();
  const isAdmin = (user?.role.role_id ?? 4) < 4;

  const usdCurrency =
    currencies.find((c) => c.currency_code === "USD") ?? currencies[0];
  const crcCurrency =
    currencies.find((c) => c.currency_code === "VES") ?? currencies[0];

  // Sincronizado con el toggle universal del header (CurrencyContext):
  // cambiarlo aqui tambien mueve el header, y viceversa.
  const {
    displayCurrency: globalDisplayCurrency,
    setDisplayCurrency: setGlobalDisplayCurrency,
  } = useDisplayCurrency();

  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>(
    (globalDisplayCurrency === "VES" ? crcCurrency : usdCurrency) ??
      currencies[0],
  );

  useEffect(() => {
    const next = globalDisplayCurrency === "VES" ? crcCurrency : usdCurrency;
    if (next) setDisplayCurrencyState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDisplayCurrency]);

  const setDisplayCurrency = (currency: Currency) => {
    setDisplayCurrencyState(currency);
    setGlobalDisplayCurrency(currency.currency_code === "VES" ? "VES" : "USD");
  };
  const [interval, setInterval] = useState<TimeInterval>("30d");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ExpenseAnalyticsRaw | null>(null);
  const [payroll, setPayroll] = useState<PayrollAnalytic | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const loadAnalytics = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setAnalyticsError(null);
    const { startDate, endDate } = intervalToDates(interval);
    try {
      const [
        fixedVsVariable,
        fixedBreakdown,
        variableBreakdown,
        salesVsExpenses,
        payrollData,
      ] = await Promise.all([
        // Los analiticos filtran por dia (expense_date es date): dias locales.
        financesApi.getFixedVsVariable(
          tenantId,
          startDate,
          endDate,
          selectedBranchId,
        ),
        financesApi.getFixedBreakdown(
          tenantId,
          startDate,
          endDate,
          selectedBranchId,
        ),
        financesApi.getVariableBreakdown(
          tenantId,
          startDate,
          endDate,
          selectedBranchId,
        ),
        financesApi.getSalesVsExpenses(
          tenantId,
          startDate,
          endDate,
          selectedBranchId,
        ),
        // La nomina se muestra diferenciada de gastos operativos/fijos/variables
        // (no vive en accounting_schema.expense). El backend filtra planillas
        // cerradas pagadas en el rango y por sucursal.
        financesApi.getPayroll(tenantId, startDate, endDate, selectedBranchId),
      ]);
      setAnalytics({
        fixedVsVariable,
        fixedBreakdown,
        variableBreakdown,
        salesVsExpenses,
      });
      setPayroll(payrollData);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Error al cargar analíticos');
    } finally {
      setLoading(false);
    }
  }, [tenantId, interval, selectedBranchId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Tras registrar un gasto: recargar analiticos e historial.
  const handleExpenseRegistered = useCallback(() => {
    loadAnalytics();
    setHistoryRefresh((n) => n + 1);
  }, [loadAnalytics]);

  // Los analiticos llegan en USD y VES, convertidos con la tasa de la fecha de
  // cada gasto o venta (FNZ-X-02); se elige la columna del toggle. Todo lo que
  // sigue ya esta expresado en displayCurrency.
  const display = useMemo(
    () =>
      analytics
        ? normalizeExpenseAnalytics(analytics, displayCurrency.currency_id)
        : null,
    [analytics, displayCurrency.currency_id],
  );

  const totalExpenses =
    display?.fixedVsVariable.reduce(
      (sum, d) => sum + Number(d.total_amount),
      0,
    ) ?? 0;
  const fixedTotal = Number(
    display?.fixedVsVariable.find((d) => d.is_fixed)?.total_amount ?? 0,
  );
  const variableTotal = Number(
    display?.fixedVsVariable.find((d) => !d.is_fixed)?.total_amount ?? 0,
  );

  const fmt = (v: number) =>
    loading ? "..." : formatInCurrency(v, displayCurrency);

  const fmtPayroll = (field: "gross_total" | "net_total") =>
    loading || !payroll
      ? "..."
      : formatInCurrency(
          pickAmount(payroll, field, displayCurrency.currency_id),
          displayCurrency,
        );

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {analyticsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Error al cargar analíticos: {analyticsError}
        </div>
      )}
      <PageHeaderBanner
        eyebrow="Finanzas"
        title="Gastos"
        description="Distribución y seguimiento de egresos operativos"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <TimeIntervalSelector value={interval} onChange={setInterval} />
          {currencies.length > 0 && (
            <CurrencyToggle
              currencies={currencies}
              value={displayCurrency}
              onChange={setDisplayCurrency}
            />
          )}
        </div>
      </PageHeaderBanner>

      {/* 1. Torta principal: Fijo vs Variable */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Distribución total de gastos
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Gastos fijos vs variables en el período seleccionado
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total gastos operativos", value: totalExpenses },
            { label: "Gastos fijos", value: fixedTotal },
            { label: "Gastos variables", value: variableTotal },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-red-50 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-red-600 mb-1">{label}</p>
              <p className="text-lg font-bold text-red-700">{fmt(value)}</p>
            </div>
          ))}
          {/* Nomina: diferenciada de operativo/fijo/variable, no vive en
              accounting_schema.expense (ver hr_schema.paysheet). */}
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-600 mb-1">Nómina</p>
            <p className="text-lg font-bold text-indigo-700">
              {fmtPayroll("gross_total")}
            </p>
            {!loading && payroll && payroll.paysheet_count > 0 && (
              <p className="text-[11px] text-indigo-500 mt-1">
                Neto pagado {fmtPayroll("net_total")} ·{" "}
                {payroll.paysheet_count}{" "}
                {payroll.paysheet_count === 1 ? "planilla" : "planillas"}
              </p>
            )}
          </div>
        </div>

        <ExpenseDistributionChart
          data={display?.fixedVsVariable ?? []}
          displayCurrency={displayCurrency}
        />
      </div>

      {/* 2. Tortas de desglose en paralelo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <ExpenseBreakdownChart
            data={display?.fixedBreakdown ?? []}
            title="Desglose — Gastos Fijos"
            displayCurrency={displayCurrency}
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <ExpenseBreakdownChart
            data={display?.variableBreakdown ?? []}
            title="Desglose — Gastos Variables"
            displayCurrency={displayCurrency}
          />
        </div>
      </div>

      {/* 3. Barras: Ventas vs Gastos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SalesVsExpensesChart
          data={display?.salesVsExpenses ?? []}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          displayCurrency={displayCurrency}
          isLoading={loading}
        />
      </div>

      {/* 4. Historial de gastos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">
          Historial de gastos
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Registro paginado de egresos. Filtra por sucursal para reconsultar.
        </p>
        <ExpenseHistoryTable
          branches={branches}
          currencies={currencies}
          refreshSignal={historyRefresh}
        />
      </div>

      {/* 5. Sección admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Registrar gasto
            </h2>
            <ExpenseRegistrationForm
              tenantId={tenantId}
              branches={branches}
              categories={categories}
              currencies={currencies}
              userId={user?.user_id}
              onSuccess={handleExpenseRegistered}
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Catálogo de tipos
            </h2>
            <CategoryManagementPanel
              tenantId={tenantId}
              initialCategories={categories}
              canProvision={(user?.role.role_id ?? 4) <= 2}
            />
          </div>
        </div>
      )}

      {/* Exchange rates disclaimer */}
      {exchangeRates.length === 0 && currencies.length > 1 && (
        <p className="text-xs text-amber-600 text-center">
          Sin tasas de cambio configuradas — los montos en moneda extranjera
          se muestran sin convertir.
        </p>
      )}
    </div>
  );
}
