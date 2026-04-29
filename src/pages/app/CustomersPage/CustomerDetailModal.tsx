import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

import { identificationTypes } from "@/constants/identification-types";
import { defaultCustomerSegments } from "@/constants/default-customer-segments";

import type { Customer } from "@/interfaces/entities/Customer.interface";

type CustomerWithTenant = Customer & { tenant_name?: string };

export function CustomerDetailModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const segmentName =
    defaultCustomerSegments.find((s) => s.value === customer.segment_id)
      ?.label ?? (customer.segment_id ? `Segmento ${customer.segment_id}` : null);

  const docTypeLabel =
    identificationTypes.find((t) => t.value === customer.identification_type)?.label ??
    String(customer.identification_type);

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
            {field("Documento", customer.document_number)}
            {field("Segmento", segmentName)}
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
