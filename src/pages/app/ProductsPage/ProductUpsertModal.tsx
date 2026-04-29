import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CategoryComboBox } from "@/components/ui/CategoryComboBox";
import {
  AttributeAssignmentEditor,
  type AttributeAssignmentRow,
} from "@/components/ui/AttributeAssignmentEditor";
import { GroupAssignmentEditor } from "@/components/ui/GroupAssignmentEditor";
import {
  CompositionEditor,
  type CompositionEditorRow,
} from "@/components/ui/CompositionEditor";

import { productApi } from "@/api/product.api";
import { productCompositionApi } from "@/api/productComposition.api";
import { productVariantGroupApi } from "@/api/productGroup.api";

import type { Product } from "@/interfaces/entities/Product.interface";
import type { Tenant } from "@/interfaces/entities/Tenant.interface";
import type { CreateProductRequest } from "@/interfaces/api/requests/CreateProductRequest.interface";
import type { UpdateProductRequest } from "@/interfaces/api/requests/UpdateProductRequest.interface";

import {
  buildProductUpsertSchema,
  type ProductUpsertFormData,
} from "./product-upsert.schema";

type ProductWithVariant = Product & {
  variant_name?: string;
  unit_price?: number;
  product_variant_id?: string;
  is_composite?: boolean;
};

interface ProductUpsertModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  product?: ProductWithVariant;
  currentTenantId: string;
  tenants: Tenant[];
  isSuperAdmin: boolean;
  onClose: () => void;
  /** Returns the new product_variant_id so the modal can wire composition. */
  onCreate: (data: CreateProductRequest) => Promise<string | null>;
  /** Returns void; modal handles its own follow-up calls if needed. */
  onUpdate: (productId: string, data: UpdateProductRequest) => Promise<void>;
}

export function ProductUpsertModal({
  mode,
  isOpen,
  product,
  currentTenantId,
  tenants,
  isSuperAdmin,
  onClose,
  onCreate,
  onUpdate,
}: ProductUpsertModalProps) {
  const isEditing = mode === "edit";
  const requireTenant = isSuperAdmin && !isEditing;

  const [attributeRows, setAttributeRows] = useState<AttributeAssignmentRow[]>(
    [],
  );
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [isComposite, setIsComposite] = useState<boolean>(
    product?.is_composite === true,
  );
  const [composition, setComposition] = useState<CompositionEditorRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductUpsertFormData>({
    resolver: zodResolver(buildProductUpsertSchema(requireTenant)),
    defaultValues:
      isEditing && product
        ? {
            sku: product.sku,
            product_name: product.variant_name ?? product.product_name ?? "",
            description: product.description ?? "",
            category_id: product.category_id ?? "",
            category_name: product.category?.category_name ?? "",
            price: String(product.unit_price ?? product.price ?? ""),
            tenant_id: "",
          }
        : {
            sku: "",
            product_name: "",
            description: "",
            category_id: "",
            category_name: "",
            price: "",
            tenant_id: "",
          },
  });

  const categoryName = watch("category_name") ?? "";

  // Reset modal-local state whenever it opens or the product changes.
  useEffect(() => {
    if (!isOpen) return;
    setAttributeRows([]);
    setGroupIds([]);
    setIsComposite(product?.is_composite === true);
    setComposition([]);
    setSaveError(null);
    reset(
      isEditing && product
        ? {
            sku: product.sku,
            product_name: product.variant_name ?? product.product_name ?? "",
            description: product.description ?? "",
            category_id: product.category_id ?? "",
            category_name: product.category?.category_name ?? "",
            price: String(product.unit_price ?? product.price ?? ""),
            tenant_id: "",
          }
        : {
            sku: "",
            product_name: "",
            description: "",
            category_id: "",
            category_name: "",
            price: "",
            tenant_id: "",
          },
    );
  }, [isOpen, product, isEditing, reset]);

  // Edit mode: fetch the full state (attributes, groups, composition) so the
  // sub-sections open already populated with what's in the database.
  useEffect(() => {
    if (!isOpen || !isEditing || !product) return;
    const productId = product.product_variant_id ?? product.product_id;
    const tenantId = product.tenant_id;
    if (!productId || !tenantId) return;

    let cancelled = false;

    (async () => {
      try {
        const detail = await productApi.getByIdWithAttributes(
          tenantId,
          productId,
        );
        if (cancelled) return;

        // Group attribute_value rows by tenant_attribute_id.
        const byAttr = new Map<
          string,
          { attribute_name: string; selected_value_ids: string[] }
        >();
        for (const a of detail.attributes ?? []) {
          const existing = byAttr.get(a.tenant_attribute_id);
          if (existing) {
            existing.selected_value_ids.push(a.attribute_value_id);
          } else {
            byAttr.set(a.tenant_attribute_id, {
              attribute_name: a.attribute_name,
              selected_value_ids: [a.attribute_value_id],
            });
          }
        }
        setAttributeRows(
          Array.from(byAttr.entries()).map(([id, r]) => ({
            tenant_attribute_id: id,
            attribute_name: r.attribute_name,
            selected_value_ids: r.selected_value_ids,
          })),
        );

        setGroupIds(
          (detail.groups ?? []).map((g) => g.tenant_product_group_id),
        );

        setIsComposite(detail.is_composite === true);

        if (detail.is_composite === true) {
          const comps = await productCompositionApi.byParent(
            tenantId,
            productId,
          );
          if (cancelled) return;
          setComposition(
            comps.map((c) => ({
              child_product_variant_id: c.child_product_variant_id,
              child_display_name:
                (c.child_variant_name ?? "—") +
                (c.child_sku ? ` (${c.child_sku})` : ""),
              quantity: Number(c.quantity),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setSaveError(
            err instanceof Error
              ? `No se pudieron cargar los detalles del producto: ${err.message}`
              : "No se pudieron cargar los detalles del producto.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isEditing, product]);

  const targetTenantId = isSuperAdmin
    ? watch("tenant_id") || currentTenantId
    : currentTenantId;

  const flattenAttributeValues = (rows: AttributeAssignmentRow[]) =>
    rows.flatMap((r) => r.selected_value_ids);

  const onSubmit = async (data: ProductUpsertFormData) => {
    setSaveError(null);
    const price = parseFloat(data.price);
    const tenantId = isSuperAdmin
      ? data.tenant_id || currentTenantId
      : currentTenantId;

    const attribute_value_ids = flattenAttributeValues(attributeRows);

    setIsSaving(true);
    try {
      let variantId: string | null = null;

      if (isEditing && product) {
        const productId = product.product_variant_id ?? product.product_id;
        await onUpdate(productId, {
          product_name: data.product_name,
          description: data.description || undefined,
          category_id: data.category_id,
          price,
          attribute_value_ids,
          group_ids: groupIds,
        });
        variantId = productId;
      } else {
        variantId = await onCreate({
          tenant_id: tenantId,
          sku: data.sku.toUpperCase().trim(),
          product_name: data.product_name,
          description: data.description || undefined,
          category_id: data.category_id,
          price,
          cabys_code: data.category_id,
          attribute_value_ids,
          group_ids: groupIds,
        });
      }

      // Composition save (if applicable). Editing path also re-syncs groups in
      // case the backend update did not include them yet.
      if (variantId && isEditing) {
        await productVariantGroupApi.replace(tenantId, variantId, groupIds);
      }

      if (variantId && isComposite && composition.length > 0) {
        const components = composition
          .filter(
            (c) =>
              c.child_product_variant_id &&
              c.child_product_variant_id !== variantId &&
              c.quantity > 0,
          )
          .map((c) => ({
            child_product_variant_id: c.child_product_variant_id,
            quantity: c.quantity,
          }));

        if (components.length === 0) {
          throw new Error(
            "Un compuesto necesita al menos un componente válido (cantidad > 0).",
          );
        }

        await productCompositionApi.replace({
          tenant_id: tenantId,
          parent_product_variant_id: variantId,
          components,
        });
      } else if (variantId && !isComposite && isEditing) {
        // Editing: user un-toggled composite → clear any composition.
        await productCompositionApi
          .clear(tenantId, variantId)
          .catch(() => undefined);
      }

      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Error al guardar el producto",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Basic info ───────────────────────────── */}
        <section className="space-y-4">
          {isSuperAdmin && !isEditing && (
            <Controller
              name="tenant_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Empresa (Tenant)"
                  value={field.value}
                  onChange={field.onChange}
                  name={field.name}
                  options={tenants.map((t) => ({
                    value: t.tenant_id,
                    label: t.tenant_name,
                  }))}
                  error={errors.tenant_id?.message}
                  required
                />
              )}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              placeholder="Ej: PROD-001, ABC123"
              error={errors.sku?.message}
              disabled={isEditing}
              hint={
                isEditing
                  ? "No se puede cambiar el SKU de un producto existente"
                  : undefined
              }
              required
              {...register("sku")}
            />
            <Input
              label="Precio Unitario"
              type="number"
              placeholder="Ej: 25000.00"
              step="0.01"
              min="0"
              error={errors.price?.message}
              required
              {...register("price")}
            />
          </div>

          <Input
            label="Nombre del Producto"
            placeholder="Ej: Laptop Dell XPS 13"
            error={errors.product_name?.message}
            required
            {...register("product_name")}
          />

          <Input
            label="Descripción"
            placeholder="Descripción del producto (opcional)"
            {...register("description")}
          />

          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <CategoryComboBox
                label="Categoría CABYS"
                value={field.value}
                displayValue={categoryName}
                onChange={(id, name) => {
                  field.onChange(id);
                  setValue("category_name", name);
                }}
                error={errors.category_id?.message}
                hint="13 dígitos para facturación electrónica"
                required
              />
            )}
          />
        </section>

        {/* ─── Group assignment ─────────────────────── */}
        <section className="space-y-2">
          <header>
            <h3 className="text-sm font-semibold text-gray-900">
              Familias y dimensiones del tenant
            </h3>
            <p className="text-xs text-gray-500">
              Asigna el producto a Departamento, Familia, Marca, etc. para
              filtrado y promociones.
            </p>
          </header>
          {targetTenantId ? (
            <GroupAssignmentEditor
              tenantId={targetTenantId}
              value={groupIds}
              onChange={setGroupIds}
              disabled={isSaving}
            />
          ) : (
            <p className="text-xs text-gray-500">
              Seleccione una empresa primero.
            </p>
          )}
        </section>

        {/* ─── Attributes ───────────────────────────── */}
        <section className="space-y-2">
          <header>
            <h3 className="text-sm font-semibold text-gray-900">Atributos</h3>
            <p className="text-xs text-gray-500">
              Color, talla, material, etc. Los atributos se buscan/crean
              inline contra el catálogo del tenant + globales.
            </p>
          </header>
          {targetTenantId ? (
            <AttributeAssignmentEditor
              tenantId={targetTenantId}
              rows={attributeRows}
              onChange={setAttributeRows}
              disabled={isSaving}
            />
          ) : (
            <p className="text-xs text-gray-500">
              Seleccione una empresa primero.
            </p>
          )}
        </section>

        {/* ─── Composition / Lote ───────────────────── */}
        <section className="space-y-2">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Es un lote / compuesto
              </h3>
              <p className="text-xs text-gray-500">
                Activa para definir un producto que se desglosa en otros (ej.
                six-pack → 6 botellas, lote → 12 camisas).
              </p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isComposite}
                disabled={isSaving}
                onChange={(e) => setIsComposite(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-accent-500 transition-colors">
                <div
                  className={[
                    "absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform",
                    isComposite ? "translate-x-4" : "",
                  ].join(" ")}
                />
              </div>
            </label>
          </header>

          {isComposite && (
            <CompositionEditor
              tenantId={targetTenantId}
              parentVariantId={
                isEditing
                  ? (product?.product_variant_id ?? product?.product_id)
                  : undefined
              }
              rows={composition}
              onChange={setComposition}
              disabled={isSaving || !targetTenantId}
            />
          )}
        </section>

        {saveError && (
          <p className="text-sm text-red-600 font-medium">{saveError}</p>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSaving}
          >
            {isSaving
              ? "Guardando..."
              : isEditing
                ? "Guardar Cambios"
                : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
