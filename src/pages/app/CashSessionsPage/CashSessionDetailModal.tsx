import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { CashRegisterSession } from "@/interfaces/entities/CashRegister.interface";

interface CashSessionDetailModalProps {
  isOpen: boolean;
  session: CashRegisterSession | null;
  onClose: () => void;
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-CR") : "—";

const formatCurrency = (value?: number | null) =>
  value === undefined || value === null
    ? "—"
    : `₡ ${Number(value).toLocaleString("es-CR", {
        minimumFractionDigits: 2,
      })}`;

export function CashSessionDetailModal({
  isOpen,
  session,
  onClose,
}: CashSessionDetailModalProps) {
  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sesión de caja" size="md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="ID de sesión" value={session.cash_register_session_id} mono />
        <Field label="ID caja" value={session.cash_register_id} mono />
        <Field label="Caja" value={session.register_name ?? "—"} />
        <Field label="Sucursal" value={session.branch_name ?? "—"} />
        <Field label="Usuario" value={session.user_id} mono />
        <Field
          label="Estado"
          valueNode={
            <Badge variant={session.is_active ? "green" : "gray"}>
              {session.is_active ? "Activa" : "Cerrada"}
            </Badge>
          }
        />
        <Field label="Apertura" value={formatDate(session.opened_at)} />
        <Field label="Cierre" value={formatDate(session.closed_at)} />
        <Field
          label="Monto inicial"
          value={formatCurrency(session.opening_amount)}
        />
        <Field
          label="Monto final"
          value={formatCurrency(session.closing_amount)}
        />
        <Field label="Creada" value={formatDate(session.created_at)} />
        <Field label="Actualizada" value={formatDate(session.updated_at)} />
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
