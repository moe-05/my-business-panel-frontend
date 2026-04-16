import z from "zod";

export const setupHaciendaSchema = z.object({
  haciendaUsername: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  haciendaPassword: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(200, "Máximo 200 caracteres"),
  p12Password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(200, "Máximo 200 caracteres"),
});
