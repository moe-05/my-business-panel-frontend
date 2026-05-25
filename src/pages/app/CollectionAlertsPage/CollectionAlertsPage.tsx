import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import { accountsReceivableApi } from "@/api/accounts-receivable.api";

import { useAuth } from "@/context/AuthContext";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";

import {
  IconCalendar,
  IconCheckCircle,
  IconCreditCard,
  IconTrendingUp,
} from "@/assets/icons";

import type { UpsertCollectionAlertConfigRequest } from "@/interfaces/api/requests/AccountsReceivableRequests.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";
import type {
  CollectionAlert,
  CollectionAlertConfigResponse,
  CollectionAlertStats,
} from "@/interfaces/entities/AccountReceivable.interface";
import type { CollectionAlertsPageLoaderData } from "@/router/loaders/accounts-receivable.loaders";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getCollectionAlertTone,
} from "@/utils/accounts-receivable";

const defaultConfig: UpsertCollectionAlertConfigRequest = {
  warning_days_before_due: 7,
  urgent_days_before_due: 3,
  email_notifications_enabled: true,
  sms_notifications_enabled: false,
};

export function CollectionAlertsPage() {
  const {
    alerts: initialAlerts,
    stats: initialStats,
    configResponse: initialConfigResponse,
    currentTenantId,
    currentTenantName,
    isSuperuser,
    tenants,
  } = useLoaderData() as CollectionAlertsPageLoaderData;
  const { user } = useAuth();

  const canManage = user?.role.role_id === 1 || user?.role.role_id === 2;

  const [selectedTenantId, setSelectedTenantId] = useState(currentTenantId);
  const [alerts, setAlerts] = useState<CollectionAlert[]>(initialAlerts);
  const [stats, setStats] = useState<CollectionAlertStats>(initialStats);
  const [configResponse, setConfigResponse] =
    useState<CollectionAlertConfigResponse>(initialConfigResponse);
  const [configForm, setConfigForm] =
    useState<UpsertCollectionAlertConfigRequest>(
      initialConfigResponse.config
        ? {
            tenant_id: initialConfigResponse.tenant_id,
            warning_days_before_due:
              initialConfigResponse.config.warning_days_before_due,
            urgent_days_before_due:
              initialConfigResponse.config.urgent_days_before_due,
            email_notifications_enabled:
              initialConfigResponse.config.email_notifications_enabled,
            sms_notifications_enabled:
              initialConfigResponse.config.sms_notifications_enabled,
          }
        : { ...defaultConfig, tenant_id: currentTenantId },
    );
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return alerts;

    return alerts.filter(
      (alert) =>
        alert.customer_name.toLowerCase().includes(query) ||
        alert.alert_type.toLowerCase().includes(query),
    );
  }, [alerts, search]);

  const tenantOptions = tenants.map((tenant) => ({
    value: tenant.tenant_id,
    label: tenant.tenant_name,
  }));

  const activeTenantName =
    tenants.find((tenant) => tenant.tenant_id === selectedTenantId)
      ?.tenant_name ?? currentTenantName;

  const syncConfigForm = (
    response: CollectionAlertConfigResponse,
    tenantId: string,
  ) => {
    if (response.config) {
      setConfigForm({
        tenant_id: tenantId,
        warning_days_before_due: response.config.warning_days_before_due,
        urgent_days_before_due: response.config.urgent_days_before_due,
        email_notifications_enabled:
          response.config.email_notifications_enabled,
        sms_notifications_enabled: response.config.sms_notifications_enabled,
      });
      return;
    }

    setConfigForm({ ...defaultConfig, tenant_id: tenantId });
  };

  const refreshTenantData = async (tenantId: string) => {
    setIsRefreshing(true);
    try {
      const [nextAlerts, nextStats, nextConfigResponse] = await Promise.all([
        accountsReceivableApi.listCollectionAlerts(tenantId),
        accountsReceivableApi.getCollectionAlertStats(tenantId),
        accountsReceivableApi.getCollectionAlertConfig(tenantId),
      ]);

      setAlerts(nextAlerts);
      setStats(nextStats);
      setConfigResponse(nextConfigResponse);
      syncConfigForm(nextConfigResponse, tenantId);
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron refrescar las alertas de cobro",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!selectedTenantId) return;
    void refreshTenantData(selectedTenantId);
  }, [selectedTenantId]);

  const handleSaveConfig = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await accountsReceivableApi.saveCollectionAlertConfig({
        ...configForm,
        tenant_id: selectedTenantId,
      });
      setConfigResponse(response);
      syncConfigForm(response, selectedTenantId);
      setToast({ mode: "success", message: "Configuración guardada" });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la configuración",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleGenerateAlerts = async () => {
    setIsGenerating(true);
    try {
      const response = await accountsReceivableApi.generateCollectionAlerts(
        selectedTenantId,
      );
      setAlerts(response.alerts);
      setStats(response.stats);
      setToast({
        mode: "success",
        message: "Alertas de cobro generadas correctamente",
      });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron generar las alertas",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await accountsReceivableApi.resolveCollectionAlert(alertId);
      await refreshTenantData(selectedTenantId);
      setToast({ mode: "success", message: "Alerta resuelta manualmente" });
    } catch (error) {
      setToast({
        mode: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo resolver la alerta",
      });
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <section className="mb-6 rounded-[2rem] border border-blue-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_36%),linear-gradient(135deg,rgba(239,246,255,1),rgba(255,255,255,1)_58%,rgba(238,242,255,1))] p-6 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.24)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              POS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
              Alertas de cobro
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Configure umbrales por tenant, genere alertas de cobro pendientes
              y mantenga visibilidad sobre cuentas próximas a vencer, urgentes
              o vencidas.
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Tenant activo
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {activeTenantName}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alertas pendientes"
          value={String(stats.total_alerts)}
          icon={<IconTrendingUp />}
          sublabel="Total activo según la configuración"
          accent
        />
        <StatCard
          label="Vencidas"
          value={String(stats.overdue_count)}
          icon={<IconCheckCircle />}
          sublabel="Cobros ya fuera de fecha"
        />
        <StatCard
          label="Urgentes"
          value={String(stats.urgent_count)}
          icon={<IconCalendar />}
          sublabel="Dentro del umbral urgente"
        />
        <StatCard
          label="Monto en riesgo"
          value={formatCurrency(stats.total_amount_at_risk)}
          icon={<IconCreditCard />}
          sublabel="Saldo pendiente con alerta"
        />
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
        <form
          className="rounded-3xl border border-gray-200 bg-white p-6"
          onSubmit={handleSaveConfig}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Configuración
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Defina cuántos días antes se considera advertencia o urgencia.
              </p>
            </div>

            {isSuperuser && (
              <Select
                label="Tenant"
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
                options={tenantOptions}
                className="w-full min-w-0 sm:w-72"
              />
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Días para advertencia"
              type="number"
              min="1"
              max="365"
              value={String(configForm.warning_days_before_due)}
              onChange={(event) =>
                setConfigForm((prev) => ({
                  ...prev,
                  warning_days_before_due: Number(event.target.value),
                }))
              }
              required
            />

            <Input
              label="Días para urgencia"
              type="number"
              min="1"
              max="365"
              value={String(configForm.urgent_days_before_due)}
              onChange={(event) =>
                setConfigForm((prev) => ({
                  ...prev,
                  urgent_days_before_due: Number(event.target.value),
                }))
              }
              required
            />
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={configForm.email_notifications_enabled}
                onChange={(event) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    email_notifications_enabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Habilitar canal de correo electrónico
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={configForm.sms_notifications_enabled}
                onChange={(event) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    sms_notifications_enabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Habilitar canal de SMS
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Tipos disponibles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {configResponse.alert_types.map((alertType) => (
                <Badge
                  key={alertType.collection_alert_type_id}
                  variant={getCollectionAlertTone(
                    alertType.collection_alert_type_name,
                  )}
                >
                  {alertType.collection_alert_type_name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              loading={isGenerating}
              onClick={handleGenerateAlerts}
            >
              Generar alertas
            </Button>
            {canManage && (
              <Button type="submit" loading={isSavingConfig}>
                Guardar configuración
              </Button>
            )}
          </div>
        </form>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Input
              label="Buscar alerta"
              placeholder="Buscar por cliente o tipo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full lg:max-w-sm"
            />

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {filteredAlerts.length} alerta
                {filteredAlerts.length === 1 ? "" : "s"}
              </span>
              {isRefreshing && (
                <span className="text-xs text-gray-400">Actualizando…</span>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                {
                  key: "alert_type",
                  label: "Tipo",
                  width: "18%",
                  render: (value) => (
                    <Badge variant={getCollectionAlertTone(String(value))}>
                      {String(value)}
                    </Badge>
                  ),
                },
                { key: "customer_name", label: "Cliente", width: "20%" },
                {
                  key: "due_date",
                  label: "Vence",
                  width: "13%",
                  render: (value) => formatDate(String(value)),
                },
                {
                  key: "days_until_due",
                  label: "Días",
                  width: "10%",
                  render: (value) => {
                    const days = Number(value);
                    return (
                      <span
                        className={
                          days < 0
                            ? "font-semibold text-red-600"
                            : days <= 3
                              ? "font-semibold text-amber-600"
                              : "text-gray-700"
                        }
                      >
                        {days}
                      </span>
                    );
                  },
                },
                {
                  key: "balance_remaining",
                  label: "Saldo",
                  width: "13%",
                  render: (value) => formatCurrency(value as number | string),
                },
                {
                  key: "alert_date",
                  label: "Generada",
                  width: "14%",
                  render: (value) => formatDateTime(String(value)),
                },
                {
                  key: "actions",
                  label: "Acciones",
                  width: "12%",
                  render: (_value, alert: CollectionAlert) =>
                    canManage ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleResolve(alert.collection_alert_id)
                        }
                      >
                        Resolver
                      </Button>
                    ) : null,
                },
              ]}
              data={filteredAlerts}
              emptyMessage="No hay alertas de cobro activas para este tenant"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
