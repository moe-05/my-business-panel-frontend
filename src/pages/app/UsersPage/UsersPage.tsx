import { useEffect, useState, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { userApi } from "@/api/user.api";
import { createUser } from "@/router/actions/user.actions";
import type { UsersPageLoaderData } from "@/router/loaders/user.loaders";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Pagination } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";

import type { User } from "@/interfaces/entities/User.interface";
import type { Role } from "@/interfaces/entities/Role.interface";
import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";
import type { ToastMode } from "@/interfaces/components/ui/ToastProps.interface";

import { UserDetailModal } from "./UserDetailModal";
import { NewUserModal } from "./NewUserModal";

import { getRoleName } from "@/utils/getRoleName";

const LIMIT = 100;

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { initialUsers } = useLoaderData() as UsersPageLoaderData;
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers?.users ?? []);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(initialUsers?.page ?? 1);
  const [totalPages] = useState(
    Math.ceil((initialUsers?.total ?? 0) / (initialUsers?.limit ?? LIMIT)),
  );
  const [total, setTotal] = useState(initialUsers?.total ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Toast
  const [toast, setToast] = useState<{
    mode: ToastMode;
    message: string;
  } | null>(null);

  const tenantId = currentUser?.tenant.tenant_id ?? "";

  useEffect(() => {
    userApi
      .getRoles()
      .then(setRoles)
      .catch(console.error)
      .finally(() => setIsLoadingRoles(false));
  }, []);

  const handleCreateUser = (data: CreateUserRequest) => {
    const tempId = `temp-${Date.now()}`;
    const tempUser: User = {
      user_id: tempId,
      email: data.email,
      role_id: data.role_id,
      tenant_id: data.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUsers((prev) => [tempUser, ...prev]);
    setTotal((prev) => prev + 1);

    createUser(data)
      .then((result) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === tempId ? { ...tempUser, user_id: result.user_id } : u,
          ),
        );
        setToast({ mode: "success", message: "Usuario creado exitosamente" });
      })
      .catch((error) => {
        // Revert optimistic insert
        setUsers((prev) => prev.filter((u) => u.user_id !== tempId));
        setTotal((prev) => prev - 1);
        const message =
          error instanceof Error ? error.message : "Error al crear usuario";
        setToast({ mode: "error", message });
      });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este usuario?")) return;
    const userToDelete = users.find((u) => u.user_id === userId);
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    setTotal((prev) => prev - 1);
    try {
      await userApi.delete(userId);
    } catch (error) {
      if (userToDelete) {
        setUsers((prev) => [...prev, userToDelete]);
        setTotal((prev) => prev + 1);
      }
      const message =
        error instanceof Error ? error.message : "Error al eliminar usuario";
      setToast({ mode: "error", message });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <Toast
          mode={toast.mode}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          {`Usuarios de ${currentUser?.tenant.tenant_name ?? "tu tenant"}`}
        </p>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6 mb-6">
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
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-300 p-6">
        <Table
          columns={[
            { key: "email", label: "Email", width: "35%" },
            {
              key: "role_id",
              label: "Rol",
              width: "20%",
              render: (roleId) => (
                <Badge variant="secondary">{getRoleName(roles, roleId)}</Badge>
              ),
            },

            {
              key: "created_at",
              label: "Creado",
              width: "15%",
              render: (date) => new Date(date).toLocaleDateString("es-CR"),
            },
            {
              key: "actions",
              label: "Acciones",
              width: "5%",
              render: (_: unknown, row: User) => (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(row.user_id)}
                    title="Eliminar usuario"
                    className="p-1.5 cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ),
            },
          ]}
          data={users}
          emptyMessage="No hay usuarios para mostrar"
          onRowClick={(row) => setSelectedUser(row)}
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
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

      {/* New User Modal */}
      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        onSubmit={handleCreateUser}
      />

      {/* Hidden form ref kept for compatibility */}
      <form ref={formRef} style={{ display: "none" }} />
    </div>
  );
}
