import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { branchService } from "../../api/branchService";
import { tenantService } from "../../api/tenantService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Table, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import type {
  IBranchResponse,
  IUpdateBranchRequest,
  ITenantResponse,
} from "../../api/types/auth";

const LIMIT = 100;

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function BranchDetailModal({
  branch,
  onClose,
}: {
  branch: IBranchResponse;
  onClose: () => void;
}) {
  const field = (label: string, value?: string | number | boolean | null) => {
    let display: string;
    if (typeof value === "boolean") display = value ? "Sí" : "No";
    else display = value != null ? String(value) : "—";
    return (
      <div key={label}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-900">{display}</p>
      </div>
    );
  };

  const loc = branch as IBranchResponse & {
    provincia?: string;
    canton?: string;
    distrito?: string;
    otras_senas?: string;
  };

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Sucursal" size="md">
      <div className="space-y-5">
        {/* Branch info */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Sucursal
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("Nombre", branch.branch_name)}
            {field("Número", branch.branch_number)}
            {field("Principal", branch.is_main_branch)}
            {field("Dirección", branch.branch_address)}
          </div>
        </div>

        {/* Location (branch_location) */}
        {(loc.provincia || loc.canton || loc.otras_senas) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Ubicación (Factura Electrónica)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Provincia", loc.provincia)}
              {field("Cantón", loc.canton)}
              {field("Distrito", loc.distrito)}
              {field("Otras señas", loc.otras_senas)}
            </div>
          </div>
        )}

        {/* Tenant (superuser view) */}
        {(branch as any).tenant_name && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa
            </p>
            {field("Tenant", (branch as any).tenant_name)}
          </div>
        )}

        {/* Timestamps */}
        {branch.created_at && (
          <div className="border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {field(
                "Creado",
                new Date(branch.created_at).toLocaleString("es-CR"),
              )}
              {branch.updated_at &&
                field(
                  "Actualizado",
                  new Date(branch.updated_at).toLocaleString("es-CR"),
                )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface BranchFormState {
  branch_name: string;
  branch_number: string;
  branch_address: string;
  is_main_branch: boolean;
  tenant_id?: string;
}

interface BranchFormErrors {
  branch_name?: string;
  branch_number?: string;
  tenant_id?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BranchesPage() {
  const { user: currentUser } = useAuth();
  const [branches, setBranches] = useState<IBranchResponse[]>([]);
  const [tenants, setTenants] = useState<ITenantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedBranch, setSelectedBranch] = useState<IBranchResponse | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<IBranchResponse | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<BranchFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isSuperAdmin = currentUser?.role.role_hierarchy === 1;
  const canCreate = isSuperAdmin || currentUser?.role.role_hierarchy === 2;

  const initialFormState: BranchFormState = {
    branch_name: "",
    branch_number: "",
    branch_address: "",
    is_main_branch: false,
    tenant_id: undefined,
  };
  const [formData, setFormData] = useState<BranchFormState>(initialFormState);

  // Load branches
  const loadBranches = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      let result;
      if (isSuperAdmin) {
        result = await branchService.list(pageNum, LIMIT);
      } else {
        result = await branchService.listByTenant(
          currentUser?.tenant.tenant_id || "",
          pageNum,
          LIMIT,
        );
      }
      setBranches(result.branches);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
      setPage(result.page);
    } catch (error) {
      console.error("Error loading branches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tenants for superusers
  useEffect(() => {
    if (!isSuperAdmin) return;
    setIsLoadingTenants(true);
    tenantService
      .getAll()
      .then(setTenants)
      .catch(console.error)
      .finally(() => setIsLoadingTenants(false));
  }, [isSuperAdmin]);

  useEffect(() => {
    loadBranches(1);
  }, [isSuperAdmin, currentUser?.tenant.tenant_id]);

  const validateForm = (): boolean => {
    const errors: BranchFormErrors = {};
    if (!formData.branch_name.trim())
      errors.branch_name = "Nombre de sucursal es requerido";
    if (!editingBranch && !formData.branch_number.trim())
      errors.branch_number = "Número de sucursal es requerido";
    if (isSuperAdmin && !editingBranch && !formData.tenant_id)
      errors.tenant_id = "Empresa (Tenant) es requerida";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingBranch) {
        const updateData: IUpdateBranchRequest = {
          branch_name: formData.branch_name,
          branch_address: formData.branch_address,
          is_main_branch: formData.is_main_branch,
        };
        await branchService.update(editingBranch.branch_id, updateData);
      } else {
        const tenantId = isSuperAdmin
          ? formData.tenant_id || ""
          : currentUser?.tenant.tenant_id || "";
        await branchService.create({
          tenant_id: tenantId,
          branch_name: formData.branch_name,
          branch_number: formData.branch_number,
          branch_address: formData.branch_address,
          is_main_branch: formData.is_main_branch,
        });
      }
      await loadBranches(page);
      closeModal();
    } catch (error) {
      console.error("Error saving branch:", error);
      setFormErrors({
        branch_name:
          error instanceof Error ? error.message : "Error guardando sucursal",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = (b: IBranchResponse) => {
    setEditingBranch(b);
    setFormData({
      branch_name: b.branch_name,
      branch_number: b.branch_number,
      branch_address: b.branch_address,
      is_main_branch: b.is_main_branch,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta sucursal?")) return;
    try {
      await branchService.delete(branchId);
      await loadBranches(page);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al eliminar sucursal",
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Sucursales
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin
            ? "Sucursales de todos los tenants"
            : `Administra las sucursales de ${currentUser?.tenant.tenant_name}`}
        </p>
      </div>

      {/* Stats + Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {total} sucursal{total !== 1 ? "es" : ""}
          </span>
          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingBranch(null);
                setFormData(initialFormState);
                setFormErrors({});
                setIsModalOpen(true);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva Sucursal
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs text-gray-400 mb-4">
          Haz clic en una fila para ver el detalle de la sucursal
        </p>
        <Table
          columns={
            [
              { key: "branch_name", label: "Nombre", width: "25%" },
              { key: "branch_number", label: "Número", width: "10%" },
              ...(isSuperAdmin
                ? [
                    {
                      key: "tenant_id" as keyof IBranchResponse,
                      label: "Tenant",
                      width: "18%",
                      render: (_: unknown, row: IBranchResponse) =>
                        (row as any).tenant_name || "—",
                    },
                  ]
                : []),
              {
                key: "is_main_branch" as keyof IBranchResponse,
                label: "Principal",
                width: "12%",
                render: (isMain: unknown) => (
                  <Badge
                    variant={(isMain as boolean) ? "success" : "secondary"}
                  >
                    {(isMain as boolean) ? "Sí" : "No"}
                  </Badge>
                ),
              },
              {
                key: "branch_address",
                label: "Dirección",
                width: isSuperAdmin ? "20%" : "30%",
              },
              ...(canCreate
                ? [
                    {
                      key: "actions" as keyof IBranchResponse,
                      label: "Acciones",
                      width: "10%",
                      render: (_: unknown, row: IBranchResponse) => (
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleEditBranch(row)}
                            className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(row.branch_id)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ] as any
          }
          data={branches}
          isLoading={isLoading}
          emptyMessage="No hay sucursales registradas"
          onRowClick={(row) => setSelectedBranch(row)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              loadBranches(p);
            }}
            loading={isLoading}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedBranch && (
        <BranchDetailModal
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBranch ? "Editar Sucursal" : "Nueva Sucursal"}
        size="md"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant selector (superuser only, create mode) */}
          {isSuperAdmin &&
            !editingBranch &&
            (isLoadingTenants ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </div>
            ) : (
              <Select
                label="Empresa (Tenant)"
                value={formData.tenant_id || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, tenant_id: e.target.value }))
                }
                options={tenants.map((t) => ({
                  value: t.tenant_id,
                  label: t.tenant_name,
                }))}
                error={formErrors.tenant_id}
                required
              />
            ))}

          <Input
            label="Nombre de Sucursal"
            placeholder="Ej: Sede Central, Sucursal 1"
            value={formData.branch_name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, branch_name: e.target.value }))
            }
            error={formErrors.branch_name}
            required
          />

          <Input
            label="Número de Sucursal"
            placeholder="Ej: 001, 002, 100"
            value={formData.branch_number}
            onChange={(e) =>
              setFormData((p) => ({ ...p, branch_number: e.target.value }))
            }
            error={formErrors.branch_number}
            required={!editingBranch}
            disabled={!!editingBranch}
            hint={
              editingBranch
                ? "No se puede cambiar el número de una sucursal existente"
                : undefined
            }
          />

          <Input
            label="Dirección"
            placeholder="Dirección completa de la sucursal"
            value={formData.branch_address}
            onChange={(e) =>
              setFormData((p) => ({ ...p, branch_address: e.target.value }))
            }
          />

          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="is_main"
              checked={formData.is_main_branch}
              onChange={(e) =>
                setFormData((p) => ({ ...p, is_main_branch: e.target.checked }))
              }
              className="rounded border-blue-300 text-blue-600"
            />
            <label
              htmlFor="is_main"
              className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
            >
              Marcar como sucursal principal
            </label>
          </div>

          {formData.is_main_branch && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              ⚠️ Solo puede haber una sucursal principal por empresa. Si activas
              esto, la anterior será desactivada.
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              {editingBranch ? "Guardar Cambios" : "Crear Sucursal"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
