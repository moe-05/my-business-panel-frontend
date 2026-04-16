import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { OnboardingLayout } from "../../../components/layout/OnboardingLayout";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

const schema = z.object({
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

type FormValues = z.infer<typeof schema>;

export function SetupHaciendaPage() {
  const { data, setStep3 } = useOnboarding();
  const navigate = useNavigate();
  const [p12FileName, setP12FileName] = useState<string>("");
  const [p12Base64, setP12Base64] = useState<string>(data.p12Base64);
  const [, setError] = useState("");

  // Obtener el ID de cliente desde variable de entorno
  const haciendaClientId =
    import.meta.env.VITE_HACIENDA_CLIENT_ID || "api-prod";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      haciendaUsername: data.haciendaUsername,
      haciendaPassword: data.haciendaPassword,
      p12Password: data.p12Password,
    },
  });

  const handleP12FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setP12FileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      // readAsDataURL returns "data:application/octet-stream;base64,..."
      // Extract only the base64 part after the comma
      const base64String = base64.split(",")[1] || base64;
      setP12Base64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");

    // Validate p12 file is selected
    if (!p12Base64) {
      setError("El certificado .p12 es requerido");
      return;
    }

    setStep3({
      haciendaUsername: values.haciendaUsername,
      haciendaPassword: values.haciendaPassword,
      haciendaClientId,
      p12Base64,
      p12Password: values.p12Password,
    });

    navigate("/auth/register/payment");
  };

  return (
    <OnboardingLayout
      currentStep={3}
      panelHeadline="Configura tu Hacienda"
      panelSubtext="Necesitamos tus credenciales de ATV para la facturación electrónica."
    >
      <div>
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-2">
            Paso 3 de 4
          </p>
          <h2
            className="text-2xl font-bold text-gray-900 mb-1.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Credenciales Hacienda
          </h2>
          <p className="text-sm text-gray-500">
            Configura tu acceso al ATV de Hacienda para facturación electrónica.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Usuario de Hacienda"
            placeholder="tu_usuario_atv"
            required
            error={errors.haciendaUsername?.message}
            {...register("haciendaUsername")}
          />

          <Input
            label="Contraseña de Hacienda"
            type="password"
            placeholder="••••••••"
            required
            error={errors.haciendaPassword?.message}
            hint="Tu contraseña de acceso al ATV"
            {...register("haciendaPassword")}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Certificado .p12 <span className="text-gray-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".p12,application/pkcs12"
                onChange={handleP12FileChange}
                className="hidden"
                id="p12-file"
                required
              />
              <label
                htmlFor="p12-file"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-600 flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {p12FileName ? "Cambiar archivo" : "Seleccionar archivo"}
              </label>
              {p12FileName && (
                <div className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-green-600"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {p12FileName}
                </div>
              )}
            </div>
            {!p12Base64 && (
              <p className="text-xs text-red-500 mt-1.5">
                El certificado .p12 es requerido
              </p>
            )}
          </div>

          <Input
            label="Contraseña del Certificado"
            type="password"
            placeholder="••••••••"
            required
            error={errors.p12Password?.message}
            hint="Contraseña de acceso al certificado .p12"
            {...register("p12Password")}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => navigate("/auth/register/setup-tenant")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Atrás
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="flex-[2]"
            >
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
