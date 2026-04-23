import { z } from "zod";

export function buildProductUpsertSchema(requireTenant: boolean) {
  return z.object({
    sku: z.string().min(1, "SKU es requerido"),
    product_name: z.string().min(1, "Nombre del producto es requerido"),
    description: z.string().optional().or(z.literal("")),
    category_id: z.string().min(1, "Categoría CABYS es requerida"),
    category_name: z.string().optional(),
    price: z
      .string()
      .min(1, "Precio es requerido")
      .refine((v) => !isNaN(parseFloat(v)), "Precio debe ser un número válido")
      .refine((v) => parseFloat(v) >= 0, "El precio no puede ser negativo"),
    tenant_id: requireTenant
      ? z.string().min(1, "Empresa (Tenant) es requerida")
      : z.string(),
  });
}

export type ProductUpsertFormData = z.infer<
  ReturnType<typeof buildProductUpsertSchema>
>;
