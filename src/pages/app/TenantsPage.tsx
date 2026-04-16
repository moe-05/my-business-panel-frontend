import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { tenantService } from "../../api/tenantService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import type { ITenantResponse } from "../../api/types/auth";

export function TenantsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<ITenantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Verify user is admin nivel 1
  if (!user || user.role.role_hierarchy !== 1) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-red-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-red-700">
            Solo los administradores nivel 1 pueden acceder a la gestión de
            tenants.
          </p>
        </div>
      </div>
    );
  }

  // Load tenants
  const loadTenants = async (pageNum = 1, query = "") => {
    setIsLoading(true);
    try {
      let result;

      if (query.trim()) {
        result = await tenantService.search(query, pageNum, 20);
      } else {
        result = await tenantService.getAll(pageNum, 20);
      }

      setTenants(result.tenants);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
      setPage(result.page);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTenants(1, "");
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadTenants(1, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Delete tenant
  const handleDeleteTenant = async (tenantId: string) => {
    if (
      !confirm(
        "¿Está seguro de que desea eliminar este tenant? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      await tenantService.delete(tenantId);
      await loadTenants(page, searchQuery);
    } catch (error) {
      console.error("Error deleting tenant:", error);
      alert(
        error instanceof Error ? error.message : "Error al eliminar tenant",
      );
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Tenants
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona todos los tenants de la plataforma
        </p>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <Input
              placeholder="Buscar por nombre de tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-600">Tenants Totales</p>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <Table
          columns={[
            { key: "tenant_name", label: "Nombre", width: "25%" },
            {
              key: "identification",
              label: "Identificación",
              width: "18%",
            },
            {
              key: "is_subscribed",
              label: "Suscripción",
              width: "15%",
              render: (isSubscribed) => (
                <Badge variant={isSubscribed ? "success" : "secondary"}>
                  {isSubscribed ? "Activa" : "Inactiva"}
                </Badge>
              ),
            },
            {
              key: "contact_email",
              label: "Email de Contacto",
              width: "20%",
            },
            {
              key: "created_at",
              label: "Creado",
              width: "12%",
              render: (date) => new Date(date).toLocaleDateString(),
            },
            {
              key: "actions",
              label: "Acciones",
              width: "10%",
              render: (_, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/app/tenants/${row.tenant_id}`)}
                    className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(row.tenant_id)}
                    className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ),
            },
          ]}
          data={tenants}
          isLoading={isLoading}
          emptyMessage="No hay tenants para mostrar"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              loadTenants(newPage, searchQuery);
            }}
            loading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
