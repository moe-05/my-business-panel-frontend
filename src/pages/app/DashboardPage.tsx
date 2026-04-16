import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { tenantService } from "../../api/tenantService";
import { StatCard } from "../../components/ui/StatCard";
import { Badge, SubscriptionBadge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Table";
import type { ITenantResponse } from "../../api/types/auth";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M3 21h18M9 21V7l6-4v18M9 11h6M9 15h6M9 7h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCheckCircle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconPackage() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconContact() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Superuser Dashboard ──────────────────────────────────────────────────────

function SuperuserDashboard() {
  const [tenants, setTenants] = useState<ITenantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    tenantService
      .getAll()
      .then(setTenants)
      .catch(() => setError("No se pudieron cargar los tenants."))
      .finally(() => setLoading(false));
  }, []);

  const subscribedCount = tenants.filter((t) => t.is_subscribed).length;
  const totalPages = Math.ceil(tenants.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedTenants = tenants.slice(startIdx, endIdx);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
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
        <h2
          className="text-base font-semibold text-gray-800 mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
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

// ─── Module quick-access card ─────────────────────────────────────────────────

interface ModuleCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  code: string;
  colorClass?: string;
  accentColor?: "blue" | "purple" | "amber" | "green" | "red";
}

function ModuleCard({
  label,
  description,
  icon,
  to,
  code,
  colorClass = "",
  accentColor,
}: ModuleCardProps) {
  const colorHoverMap = {
    blue: "hover:bg-blue-50 hover:border-blue-200",
    purple: "hover:bg-purple-50 hover:border-purple-200",
    amber: "hover:bg-amber-50 hover:border-amber-200",
    green: "hover:bg-green-50 hover:border-green-200",
    red: "hover:bg-red-50 hover:border-red-200",
  };

  const colorIconMap = {
    blue: "group-hover:bg-blue-100 group-hover:text-blue-700",
    purple: "group-hover:bg-purple-100 group-hover:text-purple-700",
    amber: "group-hover:bg-amber-100 group-hover:text-amber-700",
    green: "group-hover:bg-green-100 group-hover:text-green-700",
    red: "group-hover:bg-red-100 group-hover:text-red-700",
  };

  const hoverClass = accentColor
    ? colorHoverMap[accentColor]
    : "hover:bg-gray-50 hover:border-gray-200";
  const iconHoverClass = accentColor
    ? colorIconMap[accentColor]
    : "group-hover:bg-gray-200";

  return (
    <Link
      to={to}
      className={`group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-start gap-3 hover:shadow-lg transition-all duration-200 relative overflow-hidden ${hoverClass} ${colorClass}`}
    >
      {/* Module code badge */}
      <div className="absolute top-3 right-3 text-xs font-bold opacity-10 text-gray-700 text-right">
        {code}
      </div>

      <div
        className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-700 transition-colors ${iconHoverClass}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className="font-semibold text-gray-900 text-sm"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-2 text-gray-300 group-hover:text-gray-600 transition-colors">
        <span className="text-xs font-medium text-gray-500">Acceder</span>
        <IconChevronRight />
      </div>
    </Link>
  );
}

// ─── Tenant user Dashboard ────────────────────────────────────────────────────

interface IconComponentProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
}

function IconShoppingCart(props: IconComponentProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconTrendingUp(props: IconComponentProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCreditCard(props: IconComponentProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconBriefcase(props: IconComponentProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function TenantDashboard() {
  const { user } = useAuth();

  const tenant = user?.tenant;

  const createdAt = tenant?.created_at
    ? new Date(tenant.created_at).toLocaleDateString("es-CR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  // Main modules that every user can access
  const mainModules: ModuleCardProps[] = [
    {
      label: "POS",
      description: "Punto de venta y transacciones en tiempo real",
      icon: <IconShoppingCart />,
      to: "/app/pos/sales",
      code: "POS",
      accentColor: "blue",
    },
    {
      label: "INT",
      description: "Gestión completa de inventario y stock",
      icon: <IconPackage />,
      to: "/app/int/inventory",
      code: "INT",
      accentColor: "purple",
    },
    {
      label: "SCH",
      description: "Administración de compras y proveedores",
      icon: <IconBriefcase />,
      to: "/app/sch/purchases",
      code: "SCH",
      accentColor: "amber",
    },
    {
      label: "HR",
      description: "Gestión de recursos humanos y nómina",
      icon: <IconUsers />,
      to: "/app/hr/employees",
      code: "HR",
      accentColor: "green",
    },
    {
      label: "FNZ",
      description: "Finanzas, contabilidad y reportes",
      icon: <IconCreditCard />,
      to: "/app/fnz/accounting",
      code: "FNZ",
      accentColor: "red",
    },
  ];

  // General management options
  const generalOptions: ModuleCardProps[] = [
    {
      label: "Usuarios",
      description: "Gestiona los usuarios y roles del sistema",
      icon: <IconUsers />,
      to: "/app/users",
      code: "GEN",
      accentColor: "blue",
    },
    {
      label: "Productos",
      description: "Catálogo de productos y servicios",
      icon: <IconPackage />,
      to: "/app/products",
      code: "GEN",
      accentColor: "purple",
    },
    {
      label: "Clientes",
      description: "Directorio de clientes y contactos",
      icon: <IconContact />,
      to: "/app/customers",
      code: "GEN",
      accentColor: "green",
    },
    {
      label: "Sucursales",
      description: "Gestiona las sucursales de tu empresa",
      icon: <IconMapPin />,
      to: "/app/branches",
      code: "GEN",
      accentColor: "amber",
    },
    {
      label: "Configuración",
      description: "Segmentos, márgenes y catálogos",
      icon: <IconSettings />,
      to: "/app/settings",
      code: "GEN",
      accentColor: "red",
    },
    {
      label: "Mi Perfil",
      description: "Actualiza tu información personal",
      icon: <IconUser />,
      to: "/app/profile",
      code: "GEN",
      accentColor: "blue",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Bienvenido
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.email}
          <span className="mx-1.5 text-gray-300">·</span>
          <span className="capitalize">{user?.role.role_name}</span>
        </p>
      </div>

      {/* Company info card */}
      {tenant && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center shrink-0">
            <span
              className="text-white font-bold text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {tenant.tenant_name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tenant.tenant_name}
              </h2>
              <SubscriptionBadge active={tenant.is_subscribed} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <IconMail />
                {tenant.contact_email}
              </span>
              <span className="flex items-center gap-1.5">
                <IconCalendar />
                Desde {createdAt}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Badge variant="accent">{user?.role.role_name}</Badge>
          </div>
        </div>
      )}

      {/* Main modules grid */}
      <div>
        <h2
          className="text-base font-semibold text-gray-800 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Módulos Principales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {mainModules.map((mod) => (
            <ModuleCard key={mod.to} {...mod} />
          ))}
        </div>
      </div>

      {/* General options */}
      <div>
        <h2
          className="text-base font-semibold text-gray-800 mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Administración General
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {generalOptions.map((mod) => (
            <ModuleCard key={mod.to} {...mod} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const roleId = user?.role.role_id ?? 1;

  if (roleId === 4) return <SuperuserDashboard />;
  return <TenantDashboard />;
}
