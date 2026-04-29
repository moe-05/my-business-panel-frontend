import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { IconTrash } from "@/assets/icons";

import { paymentMethods, refundStatuses } from "@/constants/payment-methods";

import type { SaleRefundContext } from "@/interfaces/entities/SaleRefundContext.interface";

import { DetailBox } from "./DetailBox";
import { RefundItemsTable } from "./RefundItemsTable";
import { formatCurrency, formatDate } from "./refunds.utils";
import type { ItemSelection, RefundMode } from "@/hooks/useRefundFlow";

interface SaleContextPanelProps {
  context: SaleRefundContext;
  mode: RefundMode;
  currencySymbol: string;
  selections: Record<string, ItemSelection>;
  onToggleItem: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number, available: number) => void;
  refundMethod: number;
  onRefundMethodChange: (value: number) => void;
  returnStatusId: number;
  onReturnStatusChange: (value: number) => void;
  refundTotal: number;
  isSubmitting: boolean;
  canSubmitPartial: boolean;
  onSubmitPartial: () => void;
  onSubmitFull: () => void;
}

export function SaleContextPanel({
  context,
  mode,
  currencySymbol,
  selections,
  onToggleItem,
  onUpdateQuantity,
  refundMethod,
  onRefundMethodChange,
  returnStatusId,
  onReturnStatusChange,
  refundTotal,
  isSubmitting,
  canSubmitPartial,
  onSubmitPartial,
  onSubmitFull,
}: SaleContextPanelProps) {
  const customerName = context.customer
    ? `${context.customer.first_name ?? ""} ${context.customer.last_name ?? ""}`.trim() ||
      "—"
    : "—";

  return (
    <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DetailBox label="Venta" mono value={context.sale.sale_id} />
        <DetailBox label="Sucursal" value={context.sale.branch_name ?? "—"} />
        <DetailBox
          label="Fecha de venta"
          value={formatDate(context.sale.sale_date)}
        />
        <DetailBox
          label="Cliente"
          value={customerName}
          hint={context.customer?.document_number ?? undefined}
        />
        <DetailBox
          label="Total venta"
          value={formatCurrency(context.sale.total_amount, currencySymbol)}
        />
        <DetailBox
          label="Estado"
          value={
            <div className="flex gap-2">
              <Badge variant={context.sale.is_completed ? "green" : "yellow"}>
                {context.sale.is_completed ? "Completada" : "Pendiente"}
              </Badge>
              {context.sale.has_electronic_invoice && (
                <Badge variant="blue">Factura electrónica</Badge>
              )}
            </div>
          }
        />
      </div>

      {context.digital_invoice && (
        <InvoiceSection
          title="Factura digital"
          rows={[
            {
              label: "ID",
              mono: true,
              value: context.digital_invoice.digital_sale_invoice_id,
            },
            {
              label: "Número",
              value: context.digital_invoice.invoice_number ?? "—",
            },
            {
              label: "Emitida",
              value: formatDate(context.digital_invoice.invoiced_at),
            },
            {
              label: "Total",
              value: formatCurrency(
                context.digital_invoice.total_amount,
                currencySymbol,
              ),
            },
          ]}
        />
      )}

      {context.electronic_invoice && (
        <InvoiceSection
          title="Factura electrónica"
          rows={[
            {
              label: "ID",
              mono: true,
              value: context.electronic_invoice.electronic_sale_invoice_id,
            },
            {
              label: "Consecutivo",
              value: context.electronic_invoice.consecutive_number ?? "—",
            },
            {
              label: "Clave",
              mono: true,
              value: context.electronic_invoice.key_number ?? "—",
            },
            {
              label: "Emitida",
              value: formatDate(context.electronic_invoice.created_at),
            },
          ]}
        />
      )}

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Productos en la factura
        </h3>
        {context.items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay productos asociados a esta venta.
          </p>
        ) : mode === "partial" ? (
          <RefundItemsTable
            mode="partial"
            items={context.items}
            selections={selections}
            onToggle={onToggleItem}
            onQtyChange={onUpdateQuantity}
            currencySymbol={currencySymbol}
          />
        ) : (
          <RefundItemsTable
            mode="full"
            items={context.items}
            currencySymbol={currencySymbol}
          />
        )}
      </div>

      {mode === "partial" ? (
        <PartialRefundActions
          refundMethod={refundMethod}
          onRefundMethodChange={onRefundMethodChange}
          returnStatusId={returnStatusId}
          onReturnStatusChange={onReturnStatusChange}
          refundTotal={refundTotal}
          currencySymbol={currencySymbol}
          isSubmitting={isSubmitting}
          canSubmit={canSubmitPartial}
          onSubmit={onSubmitPartial}
        />
      ) : (
        <FullRefundActions
          context={context}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitFull}
        />
      )}
    </div>
  );
}

interface InvoiceRow {
  label: string;
  value: string;
  mono?: boolean;
}

function InvoiceSection({
  title,
  rows,
}: {
  title: string;
  rows: InvoiceRow[];
}) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {rows.map((row) => (
          <DetailBox
            key={row.label}
            label={row.label}
            value={row.value}
            mono={row.mono}
          />
        ))}
      </div>
    </div>
  );
}

interface PartialRefundActionsProps {
  refundMethod: number;
  onRefundMethodChange: (value: number) => void;
  returnStatusId: number;
  onReturnStatusChange: (value: number) => void;
  refundTotal: number;
  currencySymbol: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

function PartialRefundActions({
  refundMethod,
  onRefundMethodChange,
  returnStatusId,
  onReturnStatusChange,
  refundTotal,
  currencySymbol,
  isSubmitting,
  canSubmit,
  onSubmit,
}: PartialRefundActionsProps) {
  return (
    <div className="border-t border-gray-200 pt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Método de reembolso"
          value={String(refundMethod)}
          onChange={(e) => onRefundMethodChange(Number(e.target.value))}
          options={paymentMethods.map((m) => ({
            value: String(m.value),
            label: m.label,
          }))}
        />
        <Select
          label="Estado del reembolso"
          value={String(returnStatusId)}
          onChange={(e) => onReturnStatusChange(Number(e.target.value))}
          options={refundStatuses.map((s) => ({
            value: String(s.value),
            label: s.label,
          }))}
        />
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Total a reembolsar
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(refundTotal, currencySymbol)}
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting || !canSubmit}
          onClick={onSubmit}
        >
          Registrar reembolso parcial
        </Button>
      </div>
    </div>
  );
}

interface FullRefundActionsProps {
  context: SaleRefundContext;
  isSubmitting: boolean;
  onSubmit: () => void;
}

function FullRefundActions({
  context,
  isSubmitting,
  onSubmit,
}: FullRefundActionsProps) {
  const hasDigital = Boolean(context.digital_invoice);
  const hasElectronic = Boolean(context.electronic_invoice);

  return (
    <div className="border-t border-gray-200 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="text-sm text-gray-700">
        <p className="font-semibold mb-1">Acción destructiva</p>
        <p>
          Se eliminarán las facturas asociadas a esta venta:
          {hasDigital && " factura digital"}
          {hasDigital && hasElectronic && " y"}
          {hasElectronic && " factura electrónica"}.
        </p>
      </div>
      <Button
        type="button"
        variant="danger"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        <IconTrash />
        Eliminar registros de factura
      </Button>
    </div>
  );
}
