import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../api/userService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Table, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import type { IUser, IRole, IUsersListResponse } from "../../api/types/auth";

const LIMIT = 100;

interface FormState {
  email: string;
  password: string;
  role_id: number;
  confirmPassword?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  role_id?: string;
  confirmPassword?: string;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  roles,
  onClose,
}: {
  user: IUser;
  roles: IRole[];
  onClose: () => void;
}) {
  const roleName =
    roles.find((r) => r.role_id === user.role_id)?.role_name ||
    `Role ${user.role_id}`;

  const field = (label: string, value?: string | number | null) => (
    <div key={label}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-900">{value ?? "—"}</p>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="Detalle de Usuario" size="md">
      <div className="space-y-5">
        {/* User section */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Usuario
          </p>
          <div className="grid grid-cols-2 gap-4">
            {field("Email", user.email)}
            {field("Rol", roleName)}
            {field("ID", user.user_id)}
            {field("Creado", new Date(user.created_at).toLocaleString("es-CR"))}
          </div>
        </div>

        {/* Tenant section */}
        {user.tenant && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empresa (Tenant)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field("Nombre", user.tenant.tenant_name)}
              {field("Email", user.tenant.contact_email)}
              {field(
                "Suscripción",
                user.tenant.is_subscribed ? "Activa" : "Inactiva",
              )}
            </div>
          </div>
        )}

        {/* Employee section (if available) */}
        {(user.first_name || user.last_name) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Empleado
            </p>
            <div className="grid grid-cols-2 gap-4">
              {field(
                "Nombre",
                `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isSuperAdmin = currentUser?.role.role_hierarchy === 1;

  const initialFormState: FormState = {
    email: "",
    password: "",
    role_id: 2,
    confirmPassword: "",
  };
  const [formData, setFormData] = useState<FormState>(initialFormState);

  // Load roles on mount
  useEffect(() => {
    userService
      .getRoles()
      .then(setRoles)
      .catch(console.error)
      .finally(() => setIsLoadingRoles(false));
  }, []);

  // Load users
  const loadUsers = async (pageNum = 1, query = "") => {
    setIsLoading(true);
    try {
      let result: IUsersListResponse;
      if (query.trim()) {
        result = await userService.search(
          query,
          isSuperAdmin ? undefined : currentUser?.tenant.tenant_id,
          pageNum,
          LIMIT,
        );
      } else {
        result = await userService.list(
          isSuperAdmin ? undefined : currentUser?.tenant.tenant_id,
          pageNum,
          LIMIT,
        );
      }
      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
      setPage(result.page);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, "");
  }, [isSuperAdmin, currentUser?.tenant.tenant_id]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.email.trim()) errors.email = "Email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Email inválido";
    if (!editingUser) {
      if (!formData.password) errors.password = "Contraseña es requerida";
      else if (formData.password.length < 6)
        errors.password = "Contraseña debe tener al menos 6 caracteres";
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Las contraseñas no coinciden";
    } else {
      if (formData.password && formData.password.length < 6)
        errors.password = "Contraseña debe tener al menos 6 caracteres";
      if (formData.password && formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (!formData.role_id) errors.role_id = "Rol es requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          email: formData.email,
          role_id: formData.role_id,
        };
        if (formData.password) updateData.password = formData.password;
        await userService.update(editingUser.user_id, updateData);
      } else {
        await userService.create({
          tenant_id: currentUser?.tenant.tenant_id || "",
          email: formData.email,
          password: formData.password,
          role_id: formData.role_id,
          employeeInfo: {
            tenant_id: currentUser?.tenant.tenant_id || "",
            branch_id: "",
            first_name: "",
            last_name: "",
            doc_number: "",
            phone: "",
            email: formData.email,
            payment_schedule_id: 0,
            contractData: {
              start_date: new Date().toISOString().split("T")[0],
              end_date: "",
              hours: 0,
              base_salary: 0,
              duties: "",
              turn_type: 0,
              turn_id: 0,
            },
          },
        });
      }
      await loadUsers(page, searchQuery);
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData(initialFormState);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving user:", error);
      setFormErrors({
        email:
          error instanceof Error ? error.message : "Error guardando usuario",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };
  const handleEditUser = (u: IUser) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: "",
      role_id: u.role_id,
      confirmPassword: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este usuario?")) return;
    try {
      await userService.delete(userId);
      await loadUsers(page, searchQuery);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const getRoleName = (roleId: number) =>
    roles.find((r) => r.role_id === roleId)?.role_name || `Role ${roleId}`;

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin
            ? "Usuarios de todos los tenants"
            : `Usuarios de ${currentUser?.tenant.tenant_name}`}
        </p>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Buscar por email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {total} usuario{total !== 1 ? "s" : ""}
            </span>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="md"
                onClick={handleNewUser}
                className="w-full lg:w-auto"
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
                Nuevo Usuario
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs text-gray-400 mb-4">
          Haz clic en una fila para ver el detalle del usuario
        </p>
        <Table
          columns={[
            { key: "email", label: "Email", width: "35%" },
            {
              key: "role_id",
              label: "Rol",
              width: "20%",
              render: (roleId) => (
                <Badge variant="secondary">{getRoleName(roleId)}</Badge>
              ),
            },
            {
              key: "tenant_id",
              label: "Tenant",
              width: "25%",
              render: (_, row) => row.tenant?.tenant_name || "N/A",
            },
            {
              key: "created_at",
              label: "Creado",
              width: "15%",
              render: (date) => new Date(date).toLocaleDateString("es-CR"),
            },
            ...(isSuperAdmin
              ? [
                  {
                    key: "actions",
                    label: "Acciones",
                    width: "5%",
                    render: (_: unknown, row: IUser) => (
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditUser(row)}
                          className="px-2 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(row.user_id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          data={users}
          isLoading={isLoading}
          emptyMessage="No hay usuarios para mostrar"
          onRowClick={(row) => setSelectedUser(row)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              loadUsers(p, searchQuery);
            }}
            loading={isLoading}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          roles={roles}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        size="md"
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
            error={formErrors.email}
            required
          />
          {isLoadingRoles ? (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
            </div>
          ) : (
            <Select
              label="Rol"
              value={formData.role_id}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  role_id: parseInt(e.target.value),
                }))
              }
              options={roles.map((r) => ({
                value: r.role_id,
                label: r.role_name,
              }))}
              error={formErrors.role_id}
              required
            />
          )}
          <Input
            label={
              editingUser
                ? "Contraseña (dejar vacío para mantener)"
                : "Contraseña"
            }
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) =>
              setFormData((p) => ({ ...p, password: e.target.value }))
            }
            error={formErrors.password}
            required={!editingUser}
          />
          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="Repite la contraseña"
            value={formData.confirmPassword || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
            }
            error={formErrors.confirmPassword}
            required={editingUser ? !!formData.password : !editingUser}
          />
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
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
