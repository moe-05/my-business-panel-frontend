import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useOnboarding } from "@/context/OnboardingContext";

import { OnboardingLayout } from "@/components/layout/OnboardingLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "./register.schema";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { data, setStep1 } = useOnboarding();
  const navigate = useNavigate();
  const [, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      docNumber: data.docNumber,
      password: data.password,
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");
    setStep1({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone,
      docNumber: values.docNumber,
    });
    navigate("/auth/register/setup-tenant");
  };

  return (
    <OnboardingLayout
      currentStep={1}
      panelHeadline="Crea tu cuenta"
      panelSubtext="En minutos tendrás tu panel configurado y listo para gestionar tu negocio."
    >
      <div>
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-2">
            Paso 1 de 4
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5 font-display">
            Datos personales
          </h2>
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/auth/login"
              className="text-gray-900 font-medium hover:text-gray-700 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              placeholder="Juan"
              required
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Apellido"
              placeholder="Pérez"
              required
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="juan@empresa.com"
            required
            autoComplete="email"
            error={errors.email?.message}
            hint="Correo administrador para acceder a tu cuenta y gestionar tu negocio"
            {...register("email")}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Tu contraseña"
            required
            autoComplete="new-password"
            error={errors.password?.message}
            hint="Debe contener al menos 8 caracteres, una mayúscula y un número"
            {...register("password")}
          />

          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
            hint="Debe coincidir con la contraseña ingresada arriba"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              placeholder="71045365"
              required
              autoComplete="tel"
              error={errors.phone?.message}
              hint="Número de teléfono para contacto"
              {...register("phone")}
            />
            <Input
              label="Número de identificación"
              placeholder="3140002575"
              required
              error={errors.docNumber?.message}
              hint="Cédula o pasaporte"
              {...register("docNumber")}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth loading={isSubmitting} size="lg">
              Continuar
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
