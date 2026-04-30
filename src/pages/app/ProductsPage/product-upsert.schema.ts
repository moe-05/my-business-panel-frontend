import { z } from "zod";

export function buildProductUpsertSchema(requireTenant: boolean) {
  return z.object({
    sku: z.string().min(1, "SKU es requerido"),
    product_name: z.string().min(1, "Nombre del producto es requerido"),
    description: z.string().optional().or(z.literal("")),
    category_id: z.string().length(13, "Debe seleccionar un código CABYS válido de 13 dígitos"),
    category_name: z.string().optional(),
    price: z
      .string()
      .min(1, "Precio es requerido")
      .refine((v) => !isNaN(parseFloat(v)), "Precio debe ser un número válido")
      .refine((v) => parseFloat(v) >= 0, "El precio no puede ser negativo"),
    cost_price: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => v === undefined || v === "" || !isNaN(parseFloat(v)),
        "Costo debe ser un número válido",
      )
      .refine(
        (v) => v === undefined || v === "" || parseFloat(v) >= 0,
        "El costo no puede ser negativo",
      ),
    tenant_id: requireTenant
      ? z.string().min(1, "Empresa (Tenant) es requerida")
      : z.string(),
  });
}

export type ProductUpsertFormData = z.infer<
  ReturnType<typeof buildProductUpsertSchema>
>;
