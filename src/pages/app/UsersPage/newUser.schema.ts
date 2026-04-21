import z from "zod";

export const employeeSchema = z.object({
  first_name: z.string().trim().min(1, "Requerido"),
  last_name: z.string().trim().min(1, "Requerido"),
  doc_number: z.string().trim().min(1, "Requerido"),
  phone: z.string().trim().min(1, "Requerido"),
  employee_email: z.string().trim().min(1, "Requerido").email("Email inválido"),
  branch_id: z.string().trim().min(1, "Selecciona una sucursal"),
  payment_schedule_id: z
    .string()
    .trim()
    .min(1, "Debe ser ≥ 1")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 1, {
      message: "Debe ser ≥ 1",
    }),
});

export const contractSchema = z
  .object({
    start_date: z.string().trim().min(1, "Requerido"),
    end_date: z.string().trim().min(1, "Requerido"),
    hours: z
      .string()
      .trim()
      .min(1, "Debe ser al menos 1")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 1, {
        message: "Debe ser al menos 1",
      }),
    base_salary: z
      .string()
      .trim()
      .min(1, "Debe ser ≥ 0")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: "Debe ser ≥ 0",
      }),
    duties: z.string().trim().min(1, "Requerido"),
    turn_type: z
      .string()
      .trim()
      .min(1, "Debe ser ≥ 1")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 1, {
        message: "Debe ser ≥ 1",
      }),
    turn_id: z
      .string()
      .trim()
      .min(1, "Debe ser ≥ 1")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 1, {
        message: "Debe ser ≥ 1",
      }),
  })
  .refine((values) => values.end_date > values.start_date, {
    message: "Debe ser posterior a la fecha de inicio",
    path: ["end_date"],
  });

export const accountSchema = z
  .object({
    email: z.string().trim().min(1, "Requerido").email("Email inválido"),
    password: z.string().min(1, "Requerido").min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Requerido"),
    role_id: z.number().int().min(1, "Requerido"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
