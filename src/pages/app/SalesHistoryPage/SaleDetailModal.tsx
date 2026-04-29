import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  getDigitalInvoiceForSale,
  getElectronicInvoiceForSale,
} from "@/router/actions/sale.actions";
import type {
  DigitalInvoiceInfo,
  ElectronicInvoiceInfo,
  SaleListItem,
} from "@/interfaces/entities/Sale.interface";

interface SaleDetailModalProps {
  isOpen: boolean;
  sale: SaleListItem | null;
  onClose: () => void;
}

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("es-CR") : "—";

const formatCurrency = (value: number, symbol: string) =>
  `${symbol} ${Number(value ?? 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
  })}`;

export function SaleDetailModal({
  isOpen,
  sale,
  onClose,
}: SaleDetailModalProps) {
  const [digitalInvoice, setDigitalInvoice] =
    useState<DigitalInvoiceInfo | null>(null);
  const [electronicInvoice, setElectronicInvoice] =
    useState<ElectronicInvoiceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !sale) {
      setDigitalInvoice(null);
      setElectronicInvoice(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      getDigitalInvoiceForSale(sale.sale_id),
      sale.has_electronic_invoice
        ? getElectronicInvoiceForSale(sale.sale_id)
        : Promise.resolve(null),
    ])
      .then(([digital, electronic]) => {
        if (cancelled) return;
        setDigitalInvoice(digital);
        setElectronicInvoice(electronic);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, sale]);

  if (!sale) return null;
  const symbol = sale.symbol ?? "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de la venta" size="md">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ID de venta" value={sale.sale_id} mono />
          <Field label="Sucursal" value={sale.branch_name} />
          <Field label="Fecha" value={formatDateTime(sale.sale_date)} />
          <Field
            label="Estado"
            valueNode={
              <Badge variant={sale.is_completed ? "green" : "yellow"}>
                {sale.is_completed ? "Completada" : "Pendiente"}
              </Badge>
            }
          />
          <Field
            label="Subtotal"
            value={formatCurrency(sale.subtotal_amount, symbol)}
          />
          <Field
            label="Impuestos"
            value={formatCurrency(sale.tax_amount, symbol)}
          />
          <Field
            label="Total"
            value={formatCurrency(sale.total_amount, symbol)}
          />
          <Field
            label="Factura electrónica"
            valueNode={
              <Badge variant={sale.has_electronic_invoice ? "green" : "gray"}>
                {sale.has_electronic_invoice ? "Sí" : "No"}
              </Badge>
            }
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Factura digital
          </h3>
          {isLoading ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : digitalInvoice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <Field
                label="Cliente"
                value={`${digitalInvoice.first_name} ${digitalInvoice.last_name}`}
              />
              <Field
                label="Documento"
                value={digitalInvoice.document_number}
              />
              <Field label="Email" value={digitalInvoice.email ?? "—"} />
              <Field
                label="Empresa"
                value={digitalInvoice.tenant_name ?? "—"}
              />
              <Field
                label="Subtotal"
                value={formatCurrency(digitalInvoice.subtotal_amount, symbol)}
              />
              <Field
                label="Total"
                value={formatCurrency(digitalInvoice.total_amount, symbol)}
              />
              <Field
                label="Fecha factura"
                value={formatDateTime(digitalInvoice.invoiced_at)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No hay factura digital registrada.
            </p>
          )}
        </div>

        {sale.has_electronic_invoice && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Factura electrónica
            </h3>
            {isLoading ? (
              <p className="text-sm text-gray-400">Cargando…</p>
            ) : electronicInvoice ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Field
                  label="Clave"
                  value={electronicInvoice.key_number}
                  mono
                />
                <Field
                  label="Consecutivo"
                  value={electronicInvoice.consecutive_number}
                  mono
                />
                <Field
                  label="Estado"
                  value={String(electronicInvoice.status_id ?? "—")}
                />
                <Field
                  label="Respuesta Hacienda"
                  value={formatDateTime(
                    electronicInvoice.hacienda_response_date ?? undefined,
                  )}
                />
                <Field
                  label="Creada"
                  value={formatDateTime(electronicInvoice.created_at)}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No se pudo recuperar la factura electrónica.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  value?: string | number;
  valueNode?: React.ReactNode;
  mono?: boolean;
}

function Field({ label, value, valueNode, mono }: FieldProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <div
        className={`mt-1 text-sm text-gray-900 ${
          mono ? "font-mono break-all" : ""
        }`}
      >
        {valueNode ?? value ?? "—"}
      </div>
    </div>
  );
}
