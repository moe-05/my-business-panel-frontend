import { z } from "zod";

export function buildCustomerUpsertSchema(requireTenant: boolean) {
  return z.object({
    first_name: z.string().min(1, "Nombre es requerido"),
    last_name: z.string().min(1, "Apellido es requerido"),
    doc_type: z.coerce.number().int().min(1, "Tipo de documento es requerido"),
    doc_number: z.string().min(1, "Número de documento es requerido"),
    birthdate: z.string().optional(),
    economic_activity: z
      .string()
      .max(6, "Máximo 6 caracteres")
      .optional()
      .or(z.literal("")),
    email: z.string().email("Email inválido").or(z.literal("")),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    province: z.string(),
    postal_code: z.string(),
    segment_id: z.string(),
    tenant_id: requireTenant
      ? z.string().min(1, "Empresa (Tenant) es requerida")
      : z.string(),
  });
}

export type CustomerUpsertFormData = z.infer<
  ReturnType<typeof buildCustomerUpsertSchema>
>;
