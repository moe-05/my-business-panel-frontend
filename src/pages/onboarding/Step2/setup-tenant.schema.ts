import { z } from "zod";

export const setupTenantSchema = z.object({
  tenantName: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  identificationType: z.number().min(1, "Selecciona un tipo de identificación"),
  identification: z
    .string()
    .min(5, "Mínimo 5 caracteres")
    .max(21, "Máximo 21 caracteres"),
  economicActivity: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(200, "Máximo 200 caracteres"),
  sign: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  branchName: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  branchNumber: z
    .string()
    .min(1, "Mínimo 1 carácter")
    .max(10, "Máximo 10 caracteres"),
  branchAddress: z
    .string()
    .min(5, "Mínimo 5 caracteres")
    .max(200, "Máximo 200 caracteres"),
  regionId: z.string().min(1, "Selecciona una región"),
  contactPhone: z
    .string()
    .min(8, "Mínimo 8 dígitos")
    .max(15, "Máximo 15 dígitos")
    .regex(/^[0-9+\-\s()]+$/, "Teléfono inválido"),
});
