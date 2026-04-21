import { tenantApi } from "@/api";
import { IconBuilding } from "@/assets/icons/IconBuilding";
import { IconCheckCircle } from "@/assets/icons/IconCheckCircle";
import { SubscriptionBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Pagination } from "@/components/ui/Table";
import type { Tenant } from "@/interfaces/entities/Tenant.interface";
import { useEffect, useState } from "react";

export function SuperuserDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [page, setPage] = useState(1),
    itemsPerPage = 100;

  useEffect(() => {
    tenantApi
      .getAll()
      .then((res) =>
        setTenants(Array.isArray(res) ? res : (res?.tenants ?? [])),
      )
      .catch(() => setError("No se pudieron cargar los tenants."))
      .finally(() => setLoading(false));
  }, []);

  const subscribedCount = tenants.filter((t) => t.is_subscribed).length,
    totalPages = Math.ceil(tenants.length / itemsPerPage),
    startIdx = (page - 1) * itemsPerPage,
    endIdx = startIdx + itemsPerPage,
    paginatedTenants = tenants.slice(startIdx, endIdx);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Panel de Control
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vista de superusuario — todos los tenants
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Tenants registrados"
          value={loading ? "—" : tenants.length}
          icon={<IconBuilding />}
          sublabel="Total en la plataforma"
          accent
        />
        <StatCard
          label="Suscripciones activas"
          value={loading ? "—" : subscribedCount}
          icon={<IconCheckCircle />}
          sublabel={`${loading ? "—" : tenants.length - subscribedCount} sin suscripción`}
        />
      </div>

      {/* Tenant list */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3 font-display">
          Tenants
        </h2>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && tenants.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            No hay tenants registrados aún.
          </div>
        )}

        {!loading && !error && tenants.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Empresa
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                        Email
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                        Identificación
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Suscripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedTenants.map((tenant) => (
                      <tr
                        key={tenant.tenant_id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium text-gray-900">
                              {tenant.tenant_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tenant.sign}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">
                          {tenant.contact_email}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                          {tenant.identification}
                        </td>
                        <td className="px-5 py-3.5">
                          <SubscriptionBadge active={tenant.is_subscribed} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
