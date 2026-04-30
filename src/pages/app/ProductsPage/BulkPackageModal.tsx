import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CategoryComboBox } from "@/components/ui/CategoryComboBox";

import { productApi, type BulkProductInput } from "@/api/product.api";
import { productCompositionApi } from "@/api/productComposition.api";

interface BulkPackageModalProps {
  isOpen: boolean;
  tenantId: string;
  onClose: () => void;
  onCreated: (createdParentId: string) => void;
}

interface FormState {
  parent_sku: string;
  parent_name: string;
  parent_unit_price: string;
  parent_cabys_code: string;
  parent_cabys_name: string;
  child_sku_prefix: string;
  child_name_template: string;
  child_count: string;
  child_unit_price: string;
  child_cost_price: string;
}

const EMPTY: FormState = {
  parent_sku: "",
  parent_name: "",
  parent_unit_price: "",
  parent_cabys_code: "",
  parent_cabys_name: "",
  child_sku_prefix: "",
  child_name_template: "",
  child_count: "12",
  child_unit_price: "0",
  child_cost_price: "0",
};

const padSequence = (index: number, total: number) => {
  const width = String(total).length;
  return String(index + 1).padStart(width, "0");
};

export function BulkPackageModal({
  isOpen,
  tenantId,
  onClose,
  onCreated,
}: BulkPackageModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const validate = (): string | null => {
    if (!tenantId) return "No se identificó el tenant";
    if (!form.parent_sku.trim()) return "El SKU del lote es obligatorio";
    if (!form.parent_name.trim()) return "El nombre del lote es obligatorio";
    if (!form.parent_cabys_code || form.parent_cabys_code.length !== 13) {
      return "Seleccione un código CABYS válido";
    }
    const price = parseFloat(form.parent_unit_price);
    if (!Number.isFinite(price) || price < 0) {
      return "Precio del lote inválido";
    }
    const count = parseInt(form.child_count, 10);
    if (!Number.isFinite(count) || count < 1 || count > 200) {
      return "La cantidad de unidades debe estar entre 1 y 200";
    }
    if (!form.child_sku_prefix.trim()) {
      return "El prefijo de SKU para las unidades es obligatorio";
    }
    if (!form.child_name_template.trim()) {
      return "El nombre base de las unidades es obligatorio";
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

    const total = parseInt(form.child_count, 10);
    const childUnitPrice = Number.parseFloat(form.child_unit_price) || 0;
    const childCostPrice = Number.parseFloat(form.child_cost_price) || 0;

    const childPrefix = form.child_sku_prefix.trim().toUpperCase();
    const childTemplate = form.child_name_template.trim();
    const cabys = form.parent_cabys_code;

    const childInputs: BulkProductInput[] = Array.from(
      { length: total },
      (_, i) => ({
        tenant_id: tenantId,
        sku: `${childPrefix}-${padSequence(i, total)}`,
        variant_name: `${childTemplate} #${padSequence(i, total)}`,
        cabys_code: cabys,
        unit_price: childUnitPrice,
        cost_price: childCostPrice,
      }),
    );

    try {
      // 1) Bulk-create the children.
      const childCreated = await productApi.createBulk(childInputs);
      if (childCreated.length !== total) {
        throw new Error(
          `Solo se crearon ${childCreated.length} de ${total} unidades. ` +
            "Revisa duplicados de SKU/nombre y vuelve a intentar.",
        );
      }

      // 2) Create the parent (composite) variant.
      const parent = await productApi.create({
        tenant_id: tenantId,
        sku: form.parent_sku.trim().toUpperCase(),
        product_name: form.parent_name.trim(),
        category_id: cabys,
        cabys_code: cabys,
        price: Number.parseFloat(form.parent_unit_price),
      });

      // 3) Mark parent as composite by replacing its composition with the
      // freshly created children (quantity=1 each).
      await productCompositionApi.replace({
        tenant_id: tenantId,
        parent_product_variant_id: parent.product_variant_id,
        components: childCreated.map((c) => ({
          child_product_variant_id: c.product_variant_id,
          quantity: 1,
        })),
      });

      onCreated(parent.product_variant_id);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el lote");
    } finally {
      setSubmitting(false);
    }
  };

  const previewCount = (() => {
    const n = parseInt(form.child_count, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Crear lote de productos"
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Esta opción crea un producto compuesto (lote) y, en una sola
          operación, genera N unidades hijas que quedan automáticamente
          asociadas al lote. Útil para registrar docenas, cajas o paquetes
          sin tener que dar de alta cada unidad por separado.
        </p>

        <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <header>
            <h3 className="text-sm font-semibold text-gray-900">
              Producto padre (el lote)
            </h3>
            <p className="text-xs text-gray-500">
              Es el producto compuesto que el usuario verá en compras y ventas.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU del lote"
              placeholder="Ej: LOTE-CAMISAS-M"
              value={form.parent_sku}
              onChange={(e) =>
                setForm((p) => ({ ...p, parent_sku: e.target.value }))
              }
              required
            />
            <Input
              label="Precio del lote"
              type="number"
              min="0"
              step="0.01"
              value={form.parent_unit_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, parent_unit_price: e.target.value }))
              }
              required
            />
          </div>

          <Input
            label="Nombre del lote"
            placeholder="Ej: Lote camisas talla M"
            value={form.parent_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, parent_name: e.target.value }))
            }
            required
          />

          <CategoryComboBox
            label="Categoría CABYS"
            value={form.parent_cabys_code}
            displayValue={form.parent_cabys_name}
            onChange={(id, name) =>
              setForm((p) => ({
                ...p,
                parent_cabys_code: id,
                parent_cabys_name: name,
              }))
            }
            hint="Se aplicará el mismo CABYS al lote y a las unidades hijas."
            required
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
          <header>
            <h3 className="text-sm font-semibold text-gray-900">Unidades del lote</h3>
            <p className="text-xs text-gray-500">
              Se generarán N variantes hijo con SKU y nombre auto-numerados.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Cantidad"
              type="number"
              min="1"
              max="200"
              value={form.child_count}
              onChange={(e) =>
                setForm((p) => ({ ...p, child_count: e.target.value }))
              }
              required
            />
            <Input
              label="Precio unitario"
              type="number"
              min="0"
              step="0.01"
              value={form.child_unit_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, child_unit_price: e.target.value }))
              }
              hint="Por defecto las unidades hijo no se venden sueltas."
            />
            <Input
              label="Costo unitario"
              type="number"
              min="0"
              step="0.01"
              value={form.child_cost_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, child_cost_price: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prefijo de SKU"
              placeholder="Ej: CAM-M"
              value={form.child_sku_prefix}
              onChange={(e) =>
                setForm((p) => ({ ...p, child_sku_prefix: e.target.value }))
              }
              hint="Se generará: CAM-M-001, CAM-M-002, ..."
              required
            />
            <Input
              label="Nombre base"
              placeholder="Ej: Camisa talla M"
              value={form.child_name_template}
              onChange={(e) =>
                setForm((p) => ({ ...p, child_name_template: e.target.value }))
              }
              hint="Se generará: Camisa talla M #001, ..."
              required
            />
          </div>

          {previewCount > 0 && form.child_sku_prefix.trim() && (
            <p className="text-xs text-gray-500">
              Vista previa del primer SKU:{" "}
              <span className="font-mono text-gray-700">
                {form.child_sku_prefix.toUpperCase()}-{padSequence(0, previewCount)}
              </span>{" "}
              · último:{" "}
              <span className="font-mono text-gray-700">
                {form.child_sku_prefix.toUpperCase()}-
                {padSequence(previewCount - 1, previewCount)}
              </span>
            </p>
          )}
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
              : `Crear lote y ${previewCount || 0} unidades`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
