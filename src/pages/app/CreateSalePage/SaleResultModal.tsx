import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle } from "@/assets/icons";
import type { DigitalInvoiceInfo } from "@/interfaces/entities/Sale.interface";
import { currencies, paymentMethods } from "@/constants/payment-methods";

interface PaymentSplit {
  id: string;
  methodId: number;
  amount: string;
  currencyId: number;
}

export interface SaleReceiptItem {
  variant_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SaleResultModalProps {
  isOpen: boolean;
  saleId: string | null;
  totalAmount: number;
  currencySymbol: string;
  hasElectronicInvoice: boolean;
  eInvoiceWarning?: string;
  items?: SaleReceiptItem[];
  digitalInvoice?: DigitalInvoiceInfo | null;
  paymentSplits: PaymentSplit[];
  pointsRedeemed?: number;
  pointsRate?: number;
  onNewSale: () => void;
}

const fmt = (value: number | null | undefined, symbol: string) =>
  `${symbol} ${Number(value ?? 0).toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-CR") : "—";

export function SaleResultModal({
  isOpen,
  saleId,
  totalAmount,
  currencySymbol,
  hasElectronicInvoice,
  eInvoiceWarning,
  items,
  digitalInvoice,
  paymentSplits,
  pointsRedeemed,
  pointsRate,
  onNewSale,
}: SaleResultModalProps) {
  const symbol = currencySymbol;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onNewSale}
      title="Venta registrada"
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* Éxito */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <IconCheckCircle />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Venta procesada exitosamente
            </h3>
          </div>
        </div>

        {/* Resumen básico */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
          <Row
            label="ID de venta"
            value={
              <span className="font-mono text-xs break-all">
                {saleId ?? "—"}
              </span>
            }
          />
          <Row
            label="Total"
            value={
              <span className="font-semibold">{fmt(totalAmount, symbol)}</span>
            }
          />
          <Row
            label="Factura electrónica"
            value={
              <span
                className={
                  hasElectronicInvoice
                    ? "text-emerald-700 font-medium"
                    : "text-gray-700"
                }
              >
                {hasElectronicInvoice ? "Generada" : "No requerida"}
              </span>
            }
          />
        </div>

        {/* Factura digital */}
        {digitalInvoice && (
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Factura digital
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              {(digitalInvoice.first_name || digitalInvoice.last_name) && (
                <Row
                  label="Cliente"
                  value={`${digitalInvoice.first_name ?? ""} ${digitalInvoice.last_name ?? ""}`.trim()}
                />
              )}
              {digitalInvoice.document_number && (
                <Row label="Documento" value={digitalInvoice.document_number} />
              )}
              <Row
                label="Subtotal"
                value={fmt(digitalInvoice.subtotal_amount, symbol)}
              />
              <Row
                label="Impuestos"
                value={fmt(digitalInvoice.tax_amount, symbol)}
              />
              <Row
                label="Total"
                value={
                  <span className="font-semibold">
                    {fmt(digitalInvoice.total_amount, symbol)}
                  </span>
                }
              />
              {digitalInvoice.amount_paid > 0 && (
                <Row
                  label="Monto pagado"
                  value={fmt(digitalInvoice.amount_paid, symbol)}
                />
              )}
              {digitalInvoice.change_amount > 0 && (
                <Row
                  label="Cambio"
                  value={fmt(digitalInvoice.change_amount, symbol)}
                />
              )}
              {!!pointsRedeemed &&
                pointsRedeemed > 0 &&
                !!pointsRate &&
                pointsRate > 0 && (
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Puntos canjeados
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-800">
                          -{pointsRedeemed.toLocaleString("es-CR")} pts
                        </span>
                        <p className="text-xs text-amber-700 mt-0.5">
                          ≈ {fmt(Math.floor(pointsRedeemed / pointsRate), "₡")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              {digitalInvoice.points_accumulated > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2 bg-purple-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-900">
                      Puntos de fidelidad otorgados
                    </span>
                    <span className="text-lg font-bold text-purple-700">
                      +{digitalInvoice.points_accumulated}
                    </span>
                  </div>
                </div>
              )}
              <Row label="Fecha" value={fmtDate(digitalInvoice.invoiced_at)} />
              {digitalInvoice.due_date && (
                <Row
                  label="Fecha límite pago"
                  value={new Date(digitalInvoice.due_date).toLocaleDateString(
                    "es-CR",
                  )}
                />
              )}
              {digitalInvoice.ad_message && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Mensaje
                  </p>
                  <p className="text-sm text-gray-700 italic">
                    {digitalInvoice.ad_message}
                  </p>
                </div>
              )}

              {/* Payment methods section */}
              {paymentSplits && paymentSplits.length > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2" />
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Métodos de pago
                  </div>
                  <div className="space-y-1">
                    {paymentSplits.map((split, idx) => {
                      const currency = currencies.find(
                        (c) => c.value === split.currencyId,
                      );
                      const method = paymentMethods.find(
                        (m) => m.value === split.methodId,
                      );
                      return (
                        <div
                          key={split.id}
                          className="bg-white border border-gray-100 rounded px-2 py-1.5 text-xs"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-700">
                              {method?.label || `Método ${idx + 1}`}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {fmt(
                                parseFloat(split.amount) || 0,
                                currency?.symbol || "$",
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Productos vendidos */}
        {items && items.length > 0 && (
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Productos vendidos
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Producto</th>
                    <th className="px-3 py-2 text-right">Cant.</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i} className="bg-white">
                      <td className="px-3 py-2 text-gray-900">
                        <div>{item.variant_name}</div>
                        {item.sku && (
                          <div className="text-xs font-mono text-gray-400">
                            {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {fmt(item.total_price, symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {eInvoiceWarning && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {eInvoiceWarning}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="primary" onClick={onNewSale} className="flex-1">
            Aceptar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}
