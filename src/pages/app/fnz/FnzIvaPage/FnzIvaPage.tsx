import { useState, useEffect, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import { fnzIvaApi } from "@/api/fnzIva.api";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { PageHeaderBanner } from "@/components/layout/PageHeaderBanner";
import { formatInCurrency } from "@/utils/purchase";
import { buildIvaSummary, ivaPeriodRange } from "@/helpers/fnzIva";
import { businessDate } from "@/utils/businessDate";
import { useDisplayCurrency } from "@/context/CurrencyContext";
import { DeferredPage } from "@/components/routing/DeferredPage";
import { IvaWithholdingsPanel } from "./components/IvaWithholdingsPanel";

import type { IvaPeriodHalf } from "@/helpers/fnzIva";
import type { IvaSummaryRaw } from "@/interfaces/entities/FnzIva.interface";
import type { FnzIvaPageLoaderData } from "@/router/loaders/fnzIva.loaders";
import type { Currency } from "@/interfaces/entities/Currency.interface";

function IvaStat({
  label,
  value,
  description,
  tone = "neutral",
  loading,
}: {
  label: string;
  value: string;
  description?: string;
  tone?: "blue" | "green" | "yellow" | "gray" | "neutral";
  loading: boolean;
}) {
  const toneClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-amber-50 border-amber-200 text-amber-700",
    gray: "bg-gray-50 border-gray-200 text-gray-600",
    neutral: "bg-white border-gray-200 text-gray-800",
  };

  return (
    <div className={`rounded-xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold">
        {loading ? <span className="animate-pulse">...</span> : value}
      </p>
      {description && <p className="text-xs mt-1 opacity-60">{description}</p>}
    </div>
  );
}

export function FnzIvaPage() {
  const { data } = useLoaderData() as { data: Promise<FnzIvaPageLoaderData> };

  return (
    <DeferredPage resolve={data}>
      {(resolved) => <FnzIvaPageContent {...resolved} />}
    </DeferredPage>
  );
}

function FnzIvaPageContent({
  tenantId,
  currencies,
  exchangeRates,
}: FnzIvaPageLoaderData) {
  // Sincronizado con el toggle universal del header (CurrencyContext).
  const { displayCurrency: globalCurrency, setDisplayCurrency: setGlobal } =
    useDisplayCurrency();
  const displayCurrency: Currency =
    currencies.find((c) => c.currency_code === globalCurrency) ??
    currencies[0];
  const setDisplayCurrency = (currency: Currency) =>
    setGlobal(currency.currency_code === "VES" ? "VES" : "USD");

  // Periodo declarable (FNZ-IV-04): mes calendario o quincena, no una
  // ventana movil. Por defecto, el mes en curso (hora de Venezuela).
  const [month, setMonth] = useState(() => businessDate().slice(0, 7));
  const [half, setHalf] = useState<IvaPeriodHalf>("full");
  const [rawSummary, setRawSummary] = useState<IvaSummaryRaw | null>(null);
  const [loading, setLoading] = useState(true);

  const period = useMemo(() => ivaPeriodRange(month, half), [month, half]);

  const loadSummary = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { start, end } = period;
    try {
      const data = await fnzIvaApi.getSummary(tenantId, start, end);
      setRawSummary(data);
    } catch {
      // Mantener datos anteriores en caso de error
    } finally {
      setLoading(false);
    }
  }, [tenantId, period]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Cada componente llega en USD y VES con la tasa de su fecha (FNZ-X-02).
  const summary = useMemo(
    () =>
      rawSummary
        ? buildIvaSummary(rawSummary, displayCurrency.currency_id)
        : null,
    [rawSummary, displayCurrency.currency_id],
  );

  const fmt = (amount: number) =>
    loading ? "..." : formatInCurrency(amount, displayCurrency);

  const ivaNeto = summary?.iva_neto ?? 0;
  const isDebt = ivaNeto > 0;

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <PageHeaderBanner
        eyebrow="Finanzas"
        title="IVA del Período"
        description="Desglose de impuesto al valor agregado para la declaración al SENIAT"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={month}
            max={businessDate().slice(0, 7)}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            aria-label="Mes del periodo"
            className="px-3 py-1 text-sm rounded-full border border-gray-300 bg-white"
          />
          <select
            value={half}
            onChange={(e) => setHalf(e.target.value as IvaPeriodHalf)}
            aria-label="Periodo"
            className="px-3 py-1 text-sm rounded-full border border-gray-300 bg-white"
          >
            <option value="full">Mes completo</option>
            <option value="first">1ra quincena (1-15)</option>
            <option value="second">2da quincena (16-fin)</option>
          </select>
          {currencies.length > 0 && (
            <CurrencyToggle
              currencies={currencies}
              value={displayCurrency}
              onChange={setDisplayCurrency}
            />
          )}
        </div>
      </PageHeaderBanner>

      {/* Fila 1: IVA Debito, notas y Recuperable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <IvaStat
          label="IVA Débito (Ventas)"
          value={fmt(summary?.iva_debito ?? 0)}
          description="IVA cobrado en ventas facturadas en el período"
          tone="gray"
          loading={loading}
        />
        <IvaStat
          label="IVA Recuperable (Compras)"
          value={fmt(summary?.iva_recuperable ?? 0)}
          description="Crédito fiscal: compras pagadas + CxP pendiente + gastos"
          tone="gray"
          loading={loading}
        />
        <IvaStat
          label="IVA Notas de Crédito"
          value={fmt(summary?.iva_notas_credito ?? 0)}
          description="IVA revertido por devoluciones y notas de crédito"
          tone="gray"
          loading={loading}
        />
        <IvaStat
          label="IVA Notas de Débito"
          value={fmt(summary?.iva_notas_debito ?? 0)}
          description="IVA agregado por notas de débito sobre facturas emitidas"
          tone="gray"
          loading={loading}
        />
      </div>

      {/* Fila 2: Desglose del credito fiscal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <IvaStat
          label="IVA Crédito — Compras Pagadas"
          value={fmt(summary?.iva_credito ?? 0)}
          description="IVA de compras con factura y pago completados"
          tone="gray"
          loading={loading}
        />
        <IvaStat
          label="IVA CxP — Pago Pendiente"
          value={fmt(summary?.iva_cxp ?? 0)}
          description="IVA acreditable de facturas recibidas con pago aún pendiente"
          tone="gray"
          loading={loading}
        />
        <IvaStat
          label="IVA Crédito — Gastos"
          value={fmt(summary?.iva_gastos ?? 0)}
          description="IVA de gastos registrados en el período"
          tone="gray"
          loading={loading}
        />
      </div>

      {/* Retenciones practicadas a proveedores (FNZ-IV-06): informativo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <IvaStat
          label="IVA Retenido a Proveedores"
          value={fmt(summary?.iva_retenido ?? 0)}
          description="Comprobantes de retención del período: se entera al SENIAT aparte, no modifica el IVA neto"
          tone="gray"
          loading={loading}
        />
      </div>

      {/* IVA Neto — tarjeta de resultado principal */}
      <div
        className={`rounded-2xl border-2 p-6 ${
          isDebt ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1">
              IVA Neto a declarar al SENIAT
            </p>
            <p
              className={`text-4xl font-bold ${
                isDebt ? "text-red-700" : "text-green-700"
              }`}
            >
              {loading
                ? "..."
                : formatInCurrency(Math.abs(ivaNeto), displayCurrency)}
            </p>
            <p
              className={`text-sm mt-2 font-semibold ${
                isDebt ? "text-red-600" : "text-green-600"
              }`}
            >
              {isDebt
                ? "Deuda con el SENIAT — monto a pagar"
                : "Saldo a favor — aplicar en el siguiente período"}
            </p>
          </div>

          {/* Fórmula explicativa */}
          <div className="text-xs text-gray-500 space-y-1 bg-white/60 rounded-xl px-4 py-3 min-w-[220px]">
            <p className="font-semibold text-gray-600 mb-2">Cálculo</p>
            <p>
              IVA Débito ajustado:{" "}
              <span className="font-medium text-gray-800">
                {fmt(summary?.iva_debito_ajustado ?? 0)}
              </span>
            </p>
            <p className="text-gray-400 text-[10px]">
              (Débito + Notas de Débito − Notas de Crédito)
            </p>
            <hr className="border-gray-200 my-1" />
            <p>
              IVA Recuperable:{" "}
              <span className="font-medium text-gray-800">
                {fmt(summary?.iva_recuperable ?? 0)}
              </span>
            </p>
            <p className="text-gray-400 text-[10px]">(Compras pagadas + CxP + Gastos)</p>
            <hr className="border-gray-200 my-1" />
            <p
              className={`font-semibold ${isDebt ? "text-red-600" : "text-green-600"}`}
            >
              Neto:{" "}
              {loading
                ? "..."
                : `${isDebt ? "" : "−"}${formatInCurrency(
                    Math.abs(ivaNeto),
                    displayCurrency,
                  )}`}
            </p>
          </div>
        </div>
      </div>

      <IvaWithholdingsPanel
        tenantId={tenantId}
        periodStart={period.start}
        periodEnd={period.end}
        displayCurrency={displayCurrency}
        onChanged={loadSummary}
      />

      {/* Disclaimer tipo de cambio */}
      {exchangeRates.length === 0 && currencies.length > 1 && (
        <p className="text-xs text-amber-600 text-center">
          Sin tasas de cambio configuradas — los montos se muestran sin
          conversión.
        </p>
      )}
    </div>
  );
}
