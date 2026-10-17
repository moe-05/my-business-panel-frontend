import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { fnzIvaApi } from "@/api/fnzIva.api";
import { formatCurrency, formatInCurrency } from "@/utils/purchase";

import type { Currency } from "@/interfaces/entities/Currency.interface";
import type { Column } from "@/interfaces/components/ui/TableProps.interface";
import type {
  Withholding,
  WithholdingCandidate,
  WithholdingConfig,
} from "@/interfaces/entities/FnzIva.interface";

interface IvaWithholdingsPanelProps {
  tenantId: string;
  /** Instantes ISO del periodo declarable seleccionado en la pagina. */
  periodStart: string;
  periodEnd: string;
  displayCurrency: Currency;
  /** Se invoca tras emitir o anular para recalcular el resumen de IVA. */
  onChanged: () => void;
}

/**
 * Retencion de IVA en compras (FNZ-IV-06). Modelo parametrizable: aqui el
 * contador marca si la empresa es agente de retencion, fija el porcentaje por
 * proveedor y emite o anula los comprobantes. No hay porcentajes por defecto.
 */
export function IvaWithholdingsPanel({
  tenantId,
  periodStart,
  periodEnd,
  displayCurrency,
  onChanged,
}: IvaWithholdingsPanelProps) {
  const [config, setConfig] = useState<WithholdingConfig | null>(null);
  const [candidates, setCandidates] = useState<WithholdingCandidate[]>([]);
  const [vouchers, setVouchers] = useState<Withholding[]>([]);
  // Porcentaje en edicion por proveedor (texto, para permitir escribir "7,").
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [cfg, cands, list] = await Promise.all([
        fnzIvaApi.getWithholdingConfig(tenantId),
        fnzIvaApi.listWithholdingCandidates(tenantId),
        fnzIvaApi.listWithholdings(tenantId, periodStart, periodEnd),
      ]);
      setConfig(cfg);
      setCandidates(cands);
      setVouchers(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar retenciones");
    }
  }, [tenantId, periodStart, periodEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(key: string, action: () => Promise<unknown>, refresh = true) {
    setBusy(key);
    setError(null);
    try {
      await action();
      await load();
      if (refresh) onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la accion");
    } finally {
      setBusy(null);
    }
  }

  const inVes = displayCurrency.currency_code === "VES";
  const fmtVoucher = (v: Withholding) => {
    const amount = inVes ? v.retained_amount_ves : v.retained_amount_usd;
    return amount === null || amount === undefined
      ? "—"
      : formatInCurrency(amount, displayCurrency);
  };

  const candidateColumns: Column[] = [
    {
      key: "supplier_name",
      label: "Proveedor",
      width: "28%",
      render: (value) => <span className="text-gray-800">{value as string}</span>,
    },
    { key: "invoice_number", label: "Factura", width: "24%" },
    {
      key: "iva_amount",
      label: "IVA (USD)",
      width: "14%",
      align: "right",
      render: (value) => formatCurrency(value as number),
    },
    {
      key: "retention_percentage",
      label: "% retención",
      width: "12%",
      align: "right",
      render: (value) => `${value as number}%`,
    },
    {
      key: "retained_amount",
      label: "A retener (USD)",
      width: "14%",
      align: "right",
      render: (value) => (
        <span className="font-semibold">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "supplier_invoice_id",
      label: "",
      width: "8%",
      align: "right",
      render: (value) => (
        <Button
          size="xs"
          loading={busy === `issue:${value as string}`}
          onClick={() =>
            void run(`issue:${value as string}`, () =>
              fnzIvaApi.issueWithholding(tenantId, value as string),
            )
          }
        >
          Emitir
        </Button>
      ),
    },
  ];

  const voucherColumns: Column[] = [
    {
      key: "voucher_number",
      label: "N°",
      width: "8%",
      render: (value, row: Withholding) => (
        <span className={row.is_voided ? "text-gray-400 line-through" : ""}>
          {String(value).padStart(8, "0")}
        </span>
      ),
    },
    {
      key: "issued_at",
      label: "Emisión",
      width: "14%",
      render: (value) => new Date(value as string).toLocaleDateString("es-VE"),
    },
    { key: "supplier_name", label: "Proveedor", width: "26%" },
    { key: "invoice_number", label: "Factura", width: "20%" },
    {
      key: "retention_percentage",
      label: "%",
      width: "8%",
      align: "right",
      render: (value) => `${value as number}%`,
    },
    {
      key: "retained_amount_usd",
      label: "Retenido",
      width: "14%",
      align: "right",
      render: (_value, row: Withholding) => (
        <span className="font-semibold">{fmtVoucher(row)}</span>
      ),
    },
    {
      key: "withholding_id",
      label: "",
      width: "10%",
      align: "right",
      render: (value, row: Withholding) =>
        row.is_voided ? (
          <span className="text-xs text-gray-400">Anulado</span>
        ) : (
          <Button
            size="xs"
            variant="dangerOutline"
            loading={busy === `void:${value as string}`}
            onClick={() =>
              void run(`void:${value as string}`, () =>
                fnzIvaApi.voidWithholding(tenantId, value as string),
              )
            }
          >
            Anular
          </Button>
        ),
    },
  ];

  if (!config) {
    return error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : null;
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-gray-900">
          Retenciones de IVA a proveedores
        </h2>
        <p className="text-sm text-gray-500">
          Los porcentajes y los proveedores sujetos a retención los define el
          contador según la normativa vigente del SENIAT; el sistema no asume
          ninguno. Lo retenido se registra como obligación por enterar al
          SENIAT y no modifica el IVA neto de la declaración propia.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={config.is_agent}
          disabled={busy === "agent"}
          onChange={(e) =>
            void run(
              "agent",
              () => fnzIvaApi.setWithholdingAgent(tenantId, e.target.checked),
              false,
            )
          }
        />
        La empresa actúa como agente de retención de IVA
      </label>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">
          Porcentaje de retención por proveedor
        </h3>
        {config.suppliers.length === 0 ? (
          <p className="text-sm text-gray-400">Sin proveedores registrados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {config.suppliers.map((s) => {
              const value =
                draft[s.supplier_id] ?? String(s.iva_retention_percentage);
              const parsed = parseFloat(value.replace(",", "."));
              const valid = !isNaN(parsed) && parsed >= 0 && parsed <= 100;
              const changed =
                valid && parsed !== Number(s.iva_retention_percentage);
              return (
                <div
                  key={s.supplier_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2"
                >
                  <span className="truncate text-sm text-gray-800">
                    {s.supplier_name}
                  </span>
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      value={value}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [s.supplier_id]: e.target.value,
                        }))
                      }
                      aria-label={`Porcentaje de retención de ${s.supplier_name}`}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    <Button
                      size="xs"
                      variant="secondary"
                      disabled={!changed}
                      loading={busy === `pct:${s.supplier_id}`}
                      onClick={() =>
                        void run(
                          `pct:${s.supplier_id}`,
                          async () => {
                            await fnzIvaApi.setSupplierRetention(
                              tenantId,
                              s.supplier_id,
                              parsed,
                            );
                            setDraft((d) => {
                              const next = { ...d };
                              delete next[s.supplier_id];
                              return next;
                            });
                          },
                          false,
                        )
                      }
                    >
                      Guardar
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {config.is_agent && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-800">
            Facturas pendientes de comprobante
          </h3>
          <Table
            columns={candidateColumns}
            data={candidates}
            emptyMessage="No hay facturas de proveedores con retención pendiente"
          />
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">
          Comprobantes del período
        </h3>
        <Table
          columns={voucherColumns}
          data={vouchers}
          emptyMessage="Sin comprobantes de retención en el período"
        />
      </div>
    </section>
  );
}
