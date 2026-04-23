import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Product } from "@/interfaces/entities/Product.interface";

export function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const field = (label: string, value?: string | number | boolean | null) => {
    const display =
      typeof value === "boolean"
        ? value
          ? "Activo"
          : "Inactivo"
        : value != null
          ? String(value)
          : "—";
    return (
      <div key={label}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-900">{display}</p>
      </div>
    );
  };

  const pv = product as Product & {
    variant_name?: string;
    unit_price?: number;
    product_variant_id?: string;
    is_active?: boolean;
    tenant_name?: string;
  };

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Producto" size="md">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Variante de Producto
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("SKU", pv.sku)}
            {field("Nombre", pv.variant_name || pv.product_name)}
            {field(
              "Precio Unitario",
              pv.unit_price != null
                ? `₡${Number(pv.unit_price).toLocaleString("es-CR")}`
                : pv.price != null
                  ? `₡${Number(pv.price).toLocaleString("es-CR")}`
                  : null,
            )}
            {field("Código CABYS", pv.cabys_code)}
            {field("Estado", pv.is_active)}
            {field("ID", pv.product_variant_id || pv.product_id)}
          </div>
        </div>

        {pv.description && (
          <div className="border-t border-gray-100 pt-4">
            {field("Descripción", pv.description)}
          </div>
        )}

        {pv.tenant_name && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa
            </p>
            {field("Tenant", pv.tenant_name)}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {field("Creado", new Date(pv.created_at).toLocaleString("es-CR"))}
            {field(
              "Actualizado",
              new Date(pv.updated_at).toLocaleString("es-CR"),
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
