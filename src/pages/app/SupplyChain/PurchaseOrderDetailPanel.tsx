import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import type {
  PaymentMethodCatalog,
  PurchaseMatching,
  PurchaseOrderDetail,
} from "@/interfaces/entities/Purchase.interface";
import type { CreatePurchasePaymentRequest } from "@/interfaces/api/requests/PurchaseModuleRequests.interface";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPaymentMethodName,
  getOrderStatusTone,
  getPayableStatusTone,
} from "@/utils/purchase";

interface PurchaseOrderDetailPanelProps {
  order: PurchaseOrderDetail;
  matching?: PurchaseMatching | null;
  showTenant?: boolean;
  /**
   * Payment methods catalog used by the inline quick-payment form. When not
   * provided, the form is hidden.
   */
  paymentMethods?: PaymentMethodCatalog[];
  /**
   * Persists a new payment against the order's account payable. The parent
   * is responsible for refreshing `order` after a successful submission.
   */
  onRegisterPayment?: (
    payload: CreatePurchasePaymentRequest,
  ) => Promise<void> | void;
}

const cell = "px-3 py-2 text-sm text-gray-700 align-top";
const headerCell = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500";

export function PurchaseOrderDetailPanel({
  order,
  matching,
  showTenant = false,
  paymentMethods,
  onRegisterPayment,
}: PurchaseOrderDetailPanelProps) {
  const [productsOnly, setProductsOnly] = useState(false);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [quickPaymentSubmitting, setQuickPaymentSubmitting] = useState(false);
  const [quickPaymentError, setQuickPaymentError] = useState<string | null>(
    null,
  );

  const balanceDue = Number(order.balance_due ?? 0);
  const accountPayableId = order.purchase_account_payable_id ?? "";
  const isPaid = !!order.is_paid || balanceDue <= 0;

  const canQuickPay = useMemo(() => {
    return (
      !!onRegisterPayment &&
      !!paymentMethods &&
      paymentMethods.length > 0 &&
      !!accountPayableId &&
      !isPaid
    );
  }, [onRegisterPayment, paymentMethods, accountPayableId, isPaid]);

  const defaultMethodId = paymentMethods?.[0]?.payment_method_id ?? 0;

  const [quickPaymentForm, setQuickPaymentForm] = useState<{
    amount_paid: string;
    payment_method_id: number;
    payment_reference: string;
  }>(() => ({
    amount_paid: balanceDue > 0 ? String(balanceDue) : "",
    payment_method_id: defaultMethodId,
    payment_reference: "",
  }));

  const openQuickPayment = () => {
    setQuickPaymentError(null);
    setQuickPaymentForm({
      amount_paid: balanceDue > 0 ? String(balanceDue) : "",
      payment_method_id: defaultMethodId,
      payment_reference: "",
    });
    setShowQuickPayment(true);
  };

  const submitQuickPayment = async () => {
    if (!onRegisterPayment || !accountPayableId) return;

    const amount = Number(quickPaymentForm.amount_paid);
    if (!Number.isFinite(amount) || amount <= 0) {
      setQuickPaymentError("Ingresa un monto mayor a 0");
      return;
    }
    if (balanceDue > 0 && amount - balanceDue > 0.01) {
      setQuickPaymentError(
        `El abono no puede exceder el saldo pendiente (${formatCurrency(balanceDue)})`,
      );
      return;
    }
    if (!quickPaymentForm.payment_method_id) {
      setQuickPaymentError("Selecciona un método de pago");
      return;
    }

    setQuickPaymentError(null);
    setQuickPaymentSubmitting(true);
    try {
      await onRegisterPayment({
        purchase_account_payable_id: accountPayableId,
        amount_paid: Number(amount.toFixed(2)),
        payment_method_id: quickPaymentForm.payment_method_id,
        payment_reference:
          quickPaymentForm.payment_reference.trim() || undefined,
      });
      setShowQuickPayment(false);
    } catch (err) {
      setQuickPaymentError(
        err instanceof Error ? err.message : "Error al registrar el abono",
      );
    } finally {
      setQuickPaymentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Vista
          </p>
          <p className="text-sm text-gray-700">
            {productsOnly
              ? "Mostrando solo los productos comprados en esta orden."
              : "Mostrando todos los detalles de la orden."}
          </p>
        </div>
        <Button
          type="button"
          variant={productsOnly ? "primary" : "secondary"}
          size="sm"
          onClick={() => setProductsOnly((prev) => !prev)}
        >
          {productsOnly ? "Ver detalles completos" : "Ver solo productos"}
        </Button>
      </div>

      {!productsOnly && (
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Orden de compra
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                {order.supplier_name}
              </h3>
              <p className="text-sm text-gray-600">
                {order.purchase_order_id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getOrderStatusTone(order.purchase_order_status_name)}>
                {order.purchase_order_status_name}
              </Badge>
              {order.account_payable_status_name && (
                <Badge
                  variant={getPayableStatusTone(order.account_payable_status_name)}
                >
                  {order.account_payable_status_name}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SummaryField label="Bodega" value={order.warehouse_name ?? "—"} />
            <SummaryField label="Sucursal" value={order.branch_name ?? "—"} />
            <SummaryField
              label="Fecha de orden"
              value={formatDate(order.purchase_order_date)}
            />
            <SummaryField
              label="Entrega esperada"
              value={formatDate(order.expected_delivery_date)}
            />
            <SummaryField label="Vencimiento" value={formatDate(order.due_date)} />
            <SummaryField
              label="Condición"
              value={order.payment_condition === "IN_FULL" ? "Pago completo" : "Crédito"}
            />
            {showTenant && (
              <SummaryField
                label="Tenant"
                value={order.tenant_name ?? order.tenant_id ?? "—"}
              />
            )}
            <SummaryField
              label="Factura"
              value={order.invoice_number ?? "Sin factura asociada"}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Totales
          </p>
          <div className="mt-4 space-y-3">
            <AmountRow label="Subtotal" value={formatCurrency(order.subtotal)} />
            <AmountRow label="Impuesto" value={formatCurrency(order.tax_amount)} />
            <AmountRow
              label="Total"
              value={formatCurrency(order.total_amount)}
              emphasized
            />
            <AmountRow label="Abonado" value={formatCurrency(order.amount_paid)} />
            <AmountRow
              label="Pendiente"
              value={formatCurrency(order.balance_due)}
              emphasized
            />
          </div>
        </section>
      </div>
      )}

      <Section
        title="Items"
        action={
          <p className="text-xs text-gray-500">
            Las columnas <span className="font-medium">Vendido 30d</span>,{" "}
            <span className="font-medium">Vendido desde OC</span> e{" "}
            <span className="font-medium">Histórico</span> reflejan ventas
            completadas para analizar la rotación.
          </p>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerCell}>SKU</th>
                <th className={headerCell}>Producto</th>
                <th className={headerCell}>Cantidad</th>
                <th className={headerCell}>Costo unitario</th>
                <th className={headerCell}>Total</th>
                <th className={headerCell}>Vendido 30d</th>
                <th className={headerCell}>Vendido desde OC</th>
                <th className={headerCell}>Histórico</th>
                <th className={headerCell}>Última venta</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const sold30 = Number(item.sales_quantity_30d ?? 0);
                const soldSincePo = Number(item.sales_quantity_since_po ?? 0);
                const soldLifetime = Number(item.sales_quantity_lifetime ?? 0);
                const ordered = Number(item.quantity_ordered ?? 0);
                const sinceRatio =
                  ordered > 0 ? Math.min(soldSincePo / ordered, 1) : 0;
                return (
                  <tr
                    key={item.purchase_order_item_id}
                    className="border-t border-gray-200"
                  >
                    <td className={`${cell} font-mono text-xs text-gray-500`}>
                      {item.sku ?? "—"}
                    </td>
                    <td className={cell}>
                      {item.variant_name ?? item.product_variant_id}
                    </td>
                    <td className={cell}>{ordered}</td>
                    <td className={cell}>{formatCurrency(item.unit_price)}</td>
                    <td className={cell}>{formatCurrency(item.line_total)}</td>
                    <td className={cell}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {sold30}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {formatCurrency(item.sales_revenue_30d)}
                        </span>
                      </div>
                    </td>
                    <td className={cell}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="font-medium text-gray-900">
                            {soldSincePo}
                          </span>
                          {ordered > 0 && (
                            <span className="text-[11px] text-gray-500">
                              de {ordered} ({Math.round(sinceRatio * 100)}%)
                            </span>
                          )}
                        </div>
                        {ordered > 0 && (
                          <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${Math.round(sinceRatio * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={cell}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {soldLifetime}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {formatCurrency(item.sales_revenue_lifetime)}
                        </span>
                      </div>
                    </td>
                    <td className={`${cell} text-xs text-gray-500`}>
                      {item.last_sold_at
                        ? formatDate(item.last_sold_at)
                        : "Sin ventas"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {!productsOnly && (
      <>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Facturas">
          <StackList
            items={order.invoices.map((invoice) => ({
              id: invoice.supplier_invoice_id,
              title: invoice.invoice_number,
              meta: `${formatDate(invoice.invoice_date)} · ${invoice.payment_condition}`,
              badge: invoice.paid ? "Pagada" : "Pendiente",
              badgeVariant: invoice.paid ? "green" : "yellow",
              amount: formatCurrency(invoice.total_amount),
            }))}
            emptyMessage="No hay facturas registradas para esta orden."
          />
        </Section>

        <Section
          title="Pagos registrados"
          action={
            canQuickPay && !showQuickPayment ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={openQuickPayment}
              >
                Registrar abono
              </Button>
            ) : null
          }
        >
          {showQuickPayment && canQuickPay && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Nuevo abono
                  </p>
                  <p className="text-xs text-amber-700">
                    Saldo pendiente:{" "}
                    <span className="font-mono">
                      {formatCurrency(balanceDue)}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickPayment(false)}
                  disabled={quickPaymentSubmitting}
                >
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quickPaymentForm.amount_paid}
                  onChange={(e) =>
                    setQuickPaymentForm((p) => ({
                      ...p,
                      amount_paid: e.target.value,
                    }))
                  }
                  required
                />
                <Select
                  label="Método de pago"
                  value={String(quickPaymentForm.payment_method_id)}
                  onChange={(e) =>
                    setQuickPaymentForm((p) => ({
                      ...p,
                      payment_method_id: Number(e.target.value),
                    }))
                  }
                  options={(paymentMethods ?? []).map((m) => ({
                    value: String(m.payment_method_id),
                    label: m.name,
                  }))}
                  required
                />
                <Input
                  label="Referencia"
                  placeholder="Opcional"
                  value={quickPaymentForm.payment_reference}
                  onChange={(e) =>
                    setQuickPaymentForm((p) => ({
                      ...p,
                      payment_reference: e.target.value,
                    }))
                  }
                />
              </div>

              {quickPaymentError && (
                <p className="text-xs text-red-600 font-medium">
                  {quickPaymentError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1 border-t border-amber-200">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={submitQuickPayment}
                  loading={quickPaymentSubmitting}
                >
                  Confirmar abono
                </Button>
              </div>
            </div>
          )}
          <StackList
            items={order.payments.map((payment) => ({
              id: payment.purchase_order_payment_id,
              title: formatCurrency(payment.amount_paid),
              meta: `${formatPaymentMethodName(payment.payment_method_name)} · ${formatDateTime(payment.payment_date)}`,
              description: payment.payment_reference ?? "Sin referencia",
            }))}
            emptyMessage="Todavía no se han registrado abonos."
          />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Recepciones">
          <StackList
            items={order.goods_receipts.map((receipt) => ({
              id: receipt.goods_receipt_id,
              title: formatDateTime(receipt.received_date),
              meta: `${receipt.items_received} item(s) recibidos`,
              amount: formatCurrency(receipt.total_amount),
            }))}
            emptyMessage="La orden todavía no ha generado recepción de mercadería."
          />
        </Section>

        <Section title="Three-way matching">
          {matching?.matching_found ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Conciliación {matching.is_matched ? "exitosa" : "con diferencias"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ejecutada el {formatDateTime(matching.matched_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={matching.amounts_matched ? "green" : "red"}>
                    Montos {matching.amounts_matched ? "OK" : "con diferencia"}
                  </Badge>
                  <Badge
                    variant={matching.quantities_matched ? "green" : "red"}
                  >
                    Cantidades{" "}
                    {matching.quantities_matched ? "OK" : "con diferencia"}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
              {matching?.message ??
                "La conciliación todavía no está disponible para esta orden."}
            </div>
          )}
        </Section>
      </div>
      </>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function AmountRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`text-sm ${emphasized ? "font-semibold text-gray-900" : "text-gray-500"}`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm ${emphasized ? "font-semibold text-gray-900" : "text-gray-700"}`}
      >
        {value}
      </span>
    </div>
  );
}

function StackList({
  items,
  emptyMessage,
}: {
  items: Array<{
    id: string;
    title: string;
    meta?: string;
    description?: string;
    amount?: string;
    badge?: string;
    badgeVariant?: "green" | "yellow" | "red" | "blue" | "secondary";
  }>;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-start justify-between gap-3 border-t border-gray-200 px-4 py-3 first:border-t-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            {item.meta && <p className="text-xs text-gray-500">{item.meta}</p>}
            {item.description && (
              <p className="mt-1 text-xs text-gray-400">{item.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.amount && (
              <span className="font-mono text-sm text-gray-700">
                {item.amount}
              </span>
            )}
            {item.badge && (
              <Badge variant={item.badgeVariant ?? "secondary"}>
                {item.badge}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
