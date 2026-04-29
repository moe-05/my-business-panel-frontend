import { Badge } from "@/components/ui/Badge";

import type {
  PurchaseMatching,
  PurchaseOrderDetail,
} from "@/interfaces/entities/Purchase.interface";

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
}

const cell = "px-3 py-2 text-sm text-gray-700 align-top";
const headerCell = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500";

export function PurchaseOrderDetailPanel({
  order,
  matching,
  showTenant = false,
}: PurchaseOrderDetailPanelProps) {
  return (
    <div className="space-y-6">
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

      <Section title="Items">
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerCell}>SKU</th>
                <th className={headerCell}>Producto</th>
                <th className={headerCell}>Cantidad</th>
                <th className={headerCell}>Costo unitario</th>
                <th className={headerCell}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.purchase_order_item_id}
                  className="border-t border-gray-200"
                >
                  <td className={`${cell} font-mono text-xs text-gray-500`}>
                    {item.sku ?? "—"}
                  </td>
                  <td className={cell}>{item.variant_name ?? item.product_variant_id}</td>
                  <td className={cell}>{item.quantity_ordered}</td>
                  <td className={cell}>{formatCurrency(item.unit_price)}</td>
                  <td className={cell}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

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

        <Section title="Pagos registrados">
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
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </h4>
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
