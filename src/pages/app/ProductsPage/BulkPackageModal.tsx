import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CategoryComboBox } from "@/components/ui/CategoryComboBox";
import {
  AttributeAssignmentEditor,
  type AttributeAssignmentRow,
} from "@/components/ui/AttributeAssignmentEditor";

import { productApi, type BulkProductInput } from "@/api/product.api";
import { productCompositionApi } from "@/api/productComposition.api";

interface BulkPackageModalProps {
  isOpen: boolean;
  tenantId: string;
  onClose: () => void;
  onOptimisticCreate: (product: {
    tempId: string;
    sku: string;
    product_name: string;
    cabys_code: string;
    price: number;
    tenant_id: string;
  }) => void;
  onConfirmCreate: (tempId: string, createdParentId: string) => void;
  onRollbackCreate: (tempId: string) => void;
}

interface ParentForm {
  sku: string;
  name: string;
  cabys_code: string;
  cabys_name: string;
}

interface ComponentForm {
  /** Local UI key — not sent to the backend. */
  key: string;
  sku: string;
  name: string;
  unit_price: string;
  cost_price: string;
  /** How many child units make up one parent unit (e.g. 6 for a six-pack). */
  quantity_per_parent: string;
  attributes: AttributeAssignmentRow[];
}

const EMPTY_PARENT: ParentForm = {
  sku: "",
  name: "",
  cabys_code: "",
  cabys_name: "",
};

const newComponent = (): ComponentForm => ({
  key: `c-${crypto.randomUUID()}`,
  sku: "",
  name: "",
  unit_price: "0",
  cost_price: "0",
  quantity_per_parent: "1",
  attributes: [],
});

export function BulkPackageModal({
  isOpen,
  tenantId,
  onClose,
  onOptimisticCreate,
  onConfirmCreate,
  onRollbackCreate,
}: BulkPackageModalProps) {
  const [parent, setParent] = useState<ParentForm>(EMPTY_PARENT);
  const [components, setComponents] = useState<ComponentForm[]>([
    newComponent(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setParent(EMPTY_PARENT);
    setComponents([newComponent()]);
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const updateComponent = (key: string, patch: Partial<ComponentForm>) => {
    setComponents((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  };

  const addComponent = () =>
    setComponents((prev) => [...prev, newComponent()]);

  const removeComponent = (key: string) =>
    setComponents((prev) =>
      prev.length === 1 ? prev : prev.filter((c) => c.key !== key),
    );

  const validate = (): string | null => {
    if (!tenantId) return "No se identificó el tenant";
    if (!parent.sku.trim()) return "El SKU del lote es obligatorio";
    if (!parent.name.trim()) return "El nombre del lote es obligatorio";
    if (!parent.cabys_code || parent.cabys_code.length !== 13) {
      return "Seleccione un código CABYS válido para el lote";
    }
    if (components.length === 0) {
      return "Agrega al menos un componente";
    }
    const seenSkus = new Set<string>();
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      const label = `Componente #${i + 1}`;
      if (!c.sku.trim()) return `${label}: SKU es obligatorio`;
      const sku = c.sku.trim().toUpperCase();
      if (seenSkus.has(sku))
        return `${label}: SKU duplicado entre componentes (${sku})`;
      seenSkus.add(sku);
      if (!c.name.trim()) return `${label}: nombre es obligatorio`;
      const price = parseFloat(c.unit_price);
      if (!Number.isFinite(price) || price < 0)
        return `${label}: precio unitario inválido`;
      const cost = parseFloat(c.cost_price);
      if (!Number.isFinite(cost) || cost < 0)
        return `${label}: costo unitario inválido`;
      const qty = parseFloat(c.quantity_per_parent);
      if (!Number.isFinite(qty) || qty <= 0)
        return `${label}: la cantidad por lote debe ser > 0`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);

    const cabys = parent.cabys_code;
    const optimisticPrice = Number(
      components
        .reduce((acc, component) => {
          const unitPrice = parseFloat(component.unit_price) || 0;
          const quantity = parseFloat(component.quantity_per_parent) || 0;
          return acc + unitPrice * quantity;
        }, 0)
        .toFixed(2),
    );
    const tempId = `temp-bulk-${crypto.randomUUID()}`;

    const childInputs: BulkProductInput[] = components.map((c) => ({
      tenant_id: tenantId,
      sku: c.sku.trim().toUpperCase(),
      variant_name: c.name.trim(),
      cabys_code: cabys,
      unit_price: parseFloat(c.unit_price) || 0,
      cost_price: parseFloat(c.cost_price) || 0,
      attribute_value_ids: c.attributes.flatMap((r) => r.selected_value_ids),
    }));

    try {
      onOptimisticCreate({
        tempId,
        sku: parent.sku.trim().toUpperCase(),
        product_name: parent.name.trim(),
        cabys_code: cabys,
        price: optimisticPrice,
        tenant_id: tenantId,
      });

      // 1) Bulk-create all children with their attributes.
      const childCreated = await productApi.createBulk(childInputs);
      if (childCreated.length !== components.length) {
        throw new Error(
          `Solo se crearon ${childCreated.length} de ${components.length} componentes. ` +
            "Revisa duplicados de SKU/nombre y vuelve a intentar.",
        );
      }

      // 2) Create the parent (lote). No price by design — lotes don't carry
      // their own price; the value is in the components.
      const parentCreated = await productApi.create({
        tenant_id: tenantId,
        sku: parent.sku.trim().toUpperCase(),
        product_name: parent.name.trim(),
        category_id: cabys,
        cabys_code: cabys,
        price: 0,
      });

      // 3) Wire composition with each component's quantity_per_parent.
      await productCompositionApi.replace({
        tenant_id: tenantId,
        parent_product_variant_id: parentCreated.product_variant_id,
        components: childCreated.map((created, i) => ({
          child_product_variant_id: created.product_variant_id,
          quantity: parseFloat(components[i].quantity_per_parent) || 1,
        })),
      });

      onConfirmCreate(tempId, parentCreated.product_variant_id);
      close();
    } catch (e) {
      onRollbackCreate(tempId);
      setError(e instanceof Error ? e.message : "Error al crear el lote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Crear lote de productos"
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Crea un producto compuesto (lote) y sus componentes individuales en
          una sola operación. Cada componente puede tener su propio SKU,
          precio, costo y atributos. El lote no tiene precio propio — el valor
          se distribuye entre los componentes.
        </p>

        <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <header>
            <h3 className="text-sm font-semibold text-gray-900">
              Producto padre (el lote)
            </h3>
            <p className="text-xs text-gray-500">
              Es el producto compuesto que el usuario verá en compras y
              ventas. Se desglosa automáticamente en sus componentes al
              desagrupar.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU del lote"
              placeholder="Ej: LOTE-CAMISAS-M"
              value={parent.sku}
              onChange={(e) =>
                setParent((p) => ({ ...p, sku: e.target.value }))
              }
              required
            />
            <Input
              label="Nombre del lote"
              placeholder="Ej: Lote camisas talla M"
              value={parent.name}
              onChange={(e) =>
                setParent((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
          </div>

          <CategoryComboBox
            label="Categoría CABYS"
            value={parent.cabys_code}
            displayValue={parent.cabys_name}
            onChange={(id, name) =>
              setParent((p) => ({
                ...p,
                cabys_code: id,
                cabys_name: name,
              }))
            }
            hint="Se aplicará el mismo CABYS al lote y a todos los componentes."
            required
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Componentes del lote
              </h3>
              <p className="text-xs text-gray-500">
                Cada componente es un producto individual con su propio SKU,
                precio, costo y atributos.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addComponent}
              disabled={submitting}
            >
              + Agregar componente
            </Button>
          </header>

          <div className="space-y-4">
            {components.map((c, i) => (
              <div
                key={c.key}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Componente #{i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeComponent(c.key)}
                    disabled={submitting || components.length === 1}
                    className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    Quitar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="SKU"
                    placeholder="Ej: CAM-M-001"
                    value={c.sku}
                    onChange={(e) =>
                      updateComponent(c.key, { sku: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Nombre"
                    placeholder="Ej: Camisa talla M"
                    value={c.name}
                    onChange={(e) =>
                      updateComponent(c.key, { name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Precio unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    value={c.unit_price}
                    onChange={(e) =>
                      updateComponent(c.key, { unit_price: e.target.value })
                    }
                  />
                  <Input
                    label="Costo unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    value={c.cost_price}
                    onChange={(e) =>
                      updateComponent(c.key, { cost_price: e.target.value })
                    }
                  />
                  <Input
                    label="Cantidad por lote"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={c.quantity_per_parent}
                    onChange={(e) =>
                      updateComponent(c.key, {
                        quantity_per_parent: e.target.value,
                      })
                    }
                    hint="Cuántas unidades caben en 1 lote"
                    required
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Atributos del componente
                  </p>
                  <AttributeAssignmentEditor
                    tenantId={tenantId}
                    rows={c.attributes}
                    onChange={(rows) =>
                      updateComponent(c.key, { attributes: rows })
                    }
                    disabled={submitting}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            {submitting
              ? "Creando lote..."
              : `Crear lote y ${components.length} componente${components.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
