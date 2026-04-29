import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle } from "@/assets/icons";

interface SaleResultModalProps {
  isOpen: boolean;
  saleId: string | null;
  totalAmount: number;
  currencySymbol: string;
  hasElectronicInvoice: boolean;
  eInvoiceWarning?: string;
  onNewSale: () => void;
  onClose: () => void;
}

const formatAmount = (value: number, symbol: string) =>
  `${symbol} ${value.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;

export function SaleResultModal({
  isOpen,
  saleId,
  totalAmount,
  currencySymbol,
  hasElectronicInvoice,
  eInvoiceWarning,
  onNewSale,
  onClose,
}: SaleResultModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Venta registrada" size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <IconCheckCircle />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Venta procesada exitosamente
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            La venta fue almacenada en la base de datos.
          </p>
        </div>

        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">ID de venta</span>
            <span className="font-mono text-gray-900 truncate ml-3">
              {saleId ?? "—"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {formatAmount(totalAmount, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-500">Factura electrónica</span>
            <span
              className={
                hasElectronicInvoice
                  ? "text-emerald-700 font-medium"
                  : "text-gray-700"
              }
            >
              {hasElectronicInvoice ? "Generada" : "No requerida"}
            </span>
          </div>
        </div>

        {eInvoiceWarning && (
          <p className="w-full text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-left">
            {eInvoiceWarning}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button variant="primary" onClick={onNewSale} className="flex-1">
            Nueva venta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
