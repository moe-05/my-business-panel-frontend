import { useEffect, useState } from "react";

import { haciendaApi } from "@/api/hacienda.api";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import type { HaciendaConfigStatus } from "@/interfaces/api/responses/HaciendaConfigStatus.interface";
import type { HaciendaConfigUpdate } from "@/interfaces/api/requests/HaciendaConfigUpdate.interface";

const CLIENT_ID_OPTIONS = [
  { value: "api-stag", label: "api-stag (Sandbox / Pruebas)" },
  { value: "api-prod", label: "api-prod (Producción)" },
];

export function HaciendaTab({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<HaciendaConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [p12FileName, setP12FileName] = useState("");
  const [form, setForm] = useState({
    hacienda_username: "",
    hacienda_password: "",
    hacienda_client_id: "api-stag",
    p12_base64: "",
    p12_password: "",
  });

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await haciendaApi.getStatus(tenantId);
      setStatus(data);
      if (data.hacienda_username)
        setForm((p) => ({
          ...p,
          hacienda_username: data.hacienda_username || "",
        }));
      if (data.hacienda_client_id)
        setForm((p) => ({
          ...p,
          hacienda_client_id: data.hacienda_client_id || "",
        }));
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [tenantId]);

  const handleP12FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setP12FileName("");
      setForm((p) => ({ ...p, p12_base64: "" }));
      return;
    }

    setP12FileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string) || "";
      const base64String = base64.split(",")[1] || base64;
      setForm((p) => ({ ...p, p12_base64: base64String }));
      setErrors((prev) => {
        if (!prev.p12_base64) return prev;
        const next = { ...prev };
        delete next.p12_base64;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = status?.configured === true;
    const errs: Record<string, string> = {};

    if (!form.hacienda_username.trim())
      errs.hacienda_username = "Usuario es requerido";
    if (!form.hacienda_client_id.trim())
      errs.hacienda_client_id = "Client ID es requerido";

    // En creación (no hay config previa), todos los secretos son requeridos.
    // En actualización, son opcionales: si están vacíos se conservan los actuales.
    if (!isUpdate) {
      if (!form.hacienda_password.trim())
        errs.hacienda_password = "Contraseña es requerida";
      if (!form.p12_base64.trim())
        errs.p12_base64 = "Certificado P12 es requerido";
      if (!form.p12_password.trim())
        errs.p12_password = "Contraseña del certificado es requerida";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload: HaciendaConfigUpdate = {
        tenant_id: tenantId,
        hacienda_username: form.hacienda_username,
        hacienda_client_id: form.hacienda_client_id,
      };
      if (form.hacienda_password.trim())
        payload.hacienda_password = form.hacienda_password;
      if (form.p12_base64.trim()) payload.p12_base64 = form.p12_base64;
      if (form.p12_password.trim())
        payload.p12_password = form.p12_password;

      await haciendaApi.save(payload);
      await loadStatus();
      setForm((p) => ({
        ...p,
        hacienda_password: "",
        p12_base64: "",
        p12_password: "",
      }));
      setP12FileName("");
      alert("Configuración de Hacienda guardada correctamente.");
    } catch (error) {
      setErrors({
        _form:
          error instanceof Error
            ? error.message
            : "Error guardando configuración",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="p-4 bg-purple-100 border border-purple-300 rounded-xl text-sm text-purple-800">
        <p className="font-semibold mb-1">
          ¿Para qué sirve la configuración de Hacienda?
        </p>
        <p>
          Esta sección permite configurar las credenciales de acceso al sistema
          de <strong>Hacienda de Costa Rica</strong> para la emisión de facturas
          electrónicas (Comprobante Electrónico). Requiere el usuario y
          contraseña del ATV (Administración Tributaria Virtual), el Client ID y
          el certificado P12 de firma digital.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {errors._form && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errors._form}
          </div>
        )}

        <Input
          label="Usuario OVI (Hacienda)"
          placeholder="Ej: cpf-04-1234-5678"
          value={form.hacienda_username}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_username: e.target.value }))
          }
          error={errors.hacienda_username}
          required
        />

        <Input
          label="Contraseña OVI"
          type="password"
          placeholder="Contraseña del portal OVI"
          value={form.hacienda_password}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_password: e.target.value }))
          }
          error={errors.hacienda_password}
          hint={
            status?.configured
              ? "Dejar vacío si no deseas cambiarla"
              : undefined
          }
          required={!status?.configured}
        />

        <Select
          label="Client ID"
          value={form.hacienda_client_id}
          onChange={(e) =>
            setForm((p) => ({ ...p, hacienda_client_id: e.target.value }))
          }
          options={CLIENT_ID_OPTIONS}
          error={errors.hacienda_client_id}
          hint="api-stag para pruebas (sandbox), api-prod para producción"
          required
        />

        <Input
          label="Certificado P12"
          type="file"
          accept=".p12,application/pkcs12"
          onChange={handleP12FileChange}
          error={errors.p12_base64}
          hint={
            p12FileName
              ? `Archivo seleccionado: ${p12FileName}`
              : status?.configured
                ? "Dejar vacío si no deseas cambiarlo"
                : "Sube tu certificado .p12"
          }
          className="cursor-pointer"
        />

        <Input
          label="Contraseña del Certificado P12"
          type="password"
          placeholder="Contraseña del certificado .p12"
          value={form.p12_password}
          onChange={(e) =>
            setForm((p) => ({ ...p, p12_password: e.target.value }))
          }
          error={errors.p12_password}
          hint={
            status?.configured
              ? "Dejar vacío si no deseas cambiarla"
              : undefined
          }
          required={!status?.configured}
        />

        <Button type="submit" variant="primary" loading={isSubmitting}>
          {status?.configured
            ? "Actualizar Configuración"
            : "Guardar Configuración"}
        </Button>
      </form>
    </div>
  );
}
