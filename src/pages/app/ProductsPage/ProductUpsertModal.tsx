import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CategoryComboBox } from "@/components/ui/CategoryComboBox";

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
};

interface ProductUpsertModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  product?: ProductWithVariant;
  currentTenantId: string;
  tenants: Tenant[];
  isSuperAdmin: boolean;
  onClose: () => void;
  onCreate: (data: CreateProductRequest) => void;
  onUpdate: (productId: string, data: UpdateProductRequest) => void;
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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

  const onSubmit = (data: ProductUpsertFormData) => {
    const price = parseFloat(data.price);

    if (isEditing && product) {
      const productId = product.product_variant_id ?? product.product_id;
      onUpdate(productId, {
        product_name: data.product_name,
        description: data.description || undefined,
        category_id: data.category_id,
        price,
      });
    } else {
      const tenantId = isSuperAdmin ? data.tenant_id : currentTenantId;
      onCreate({
        tenant_id: tenantId,
        sku: data.sku.toUpperCase().trim(),
        product_name: data.product_name,
        description: data.description || undefined,
        category_id: data.category_id,
        price,
        cabys_code: data.category_id,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              hint="Seleccione el producto específico (13 dígitos) para facturación electrónica"
              required
            />
          )}
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

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {isEditing ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
