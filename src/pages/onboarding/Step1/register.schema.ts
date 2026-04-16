import z from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Mínimo 2 caracteres")
      .max(50, "Máximo 50 caracteres"),
    lastName: z
      .string()
      .min(2, "Mínimo 2 caracteres")
      .max(50, "Máximo 50 caracteres"),
    email: z.string().min(1, "El email es requerido").email("Email inválido"),
    phone: z
      .string()
      .min(8, "Mínimo 8 dígitos")
      .max(15, "Máximo 15 dígitos")
      .regex(/^[0-9+\-\s()]+$/, "Teléfono inválido"),
    docNumber: z
      .string()
      .min(5, "Mínimo 5 caracteres")
      .max(20, "Máximo 20 caracteres"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
      .regex(/[0-9]/, "Debe tener al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
