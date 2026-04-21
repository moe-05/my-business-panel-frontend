import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Role } from "@/interfaces/entities/Role.interface";
import type { User } from "@/interfaces/entities/User.interface";
import { capitalize } from "@/utils/capitalize";

export function UserDetailModal({
  user,
  roles,
  onClose,
}: {
  user: User;
  roles: Role[];
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
          <div className="grid grid-cols-2 gap-4">
            {field("Email", user.email)}
            {field("Rol", capitalize(roleName))}
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
