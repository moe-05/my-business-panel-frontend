import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";
import { identificationTypes } from "@/constants/identification-types";

type CustomerWithTenant = Customer & { tenant_name?: string };

export function CustomerDetailModal({
  customer,
  segments,
  onClose,
}: {
  customer: Customer;
  segments: Segment[];
  onClose: () => void;
}) {
  const segmentName = segments.find(
    (s) => s.segment_id === customer.segment_id,
  )?.segment_name;
  const docTypeLabel =
    customer.doc_type === "cedula"
      ? (identificationTypes[0]?.label ?? customer.doc_type)
      : customer.doc_type === "passport"
        ? (identificationTypes[4]?.label ?? customer.doc_type)
        : customer.doc_type === "dimex"
          ? (identificationTypes[2]?.label ?? customer.doc_type)
          : customer.doc_type === "nite"
            ? (identificationTypes[3]?.label ?? customer.doc_type)
            : customer.doc_type === "other"
              ? (identificationTypes[5]?.label ?? customer.doc_type)
              : customer.doc_type;
  const tenantName = (customer as CustomerWithTenant).tenant_name;

  const field = (label: string, value?: string | number | null) => (
    <div key={label}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-900">{value ?? "—"}</p>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Cliente" size="md">
      <div className="space-y-5">
        {/* Identity */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Identificación
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("Nombre", `${customer.first_name} ${customer.last_name}`)}
            {field("Tipo Doc.", docTypeLabel)}
            {field("Documento", customer.doc_number)}
            {field(
              "Segmento",
              segmentName ??
                (customer.segment_id
                  ? `Segmento ${customer.segment_id}`
                  : null),
            )}
          </div>
        </div>

        {/* Contact */}
        {(customer.email || customer.phone) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Contacto
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Email", customer.email)}
              {field("Teléfono", customer.phone)}
            </div>
          </div>
        )}

        {/* Address */}
        {(customer.address || customer.city || customer.province) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Dirección
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Dirección", customer.address)}
              {field("Ciudad", customer.city)}
              {field("Provincia", customer.province)}
              {field("Código Postal", customer.postal_code)}
            </div>
          </div>
        )}

        {/* Tenant (superuser view) */}
        {tenantName && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa
            </p>
            {field("Tenant", tenantName)}
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {field(
              "Creado",
              new Date(customer.created_at).toLocaleString("es-CR"),
            )}
            {field(
              "Actualizado",
              new Date(customer.updated_at).toLocaleString("es-CR"),
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
