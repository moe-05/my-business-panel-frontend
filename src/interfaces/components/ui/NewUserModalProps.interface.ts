import type { Role } from "@/interfaces/entities/Role.interface";
import type { CreateUserRequest } from "@/interfaces/api/requests/CreateUserRequest.interface";

export interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  roles: Role[];
  isLoadingRoles: boolean;
  /** Llamado con el payload listo. El padre gestiona el UI optimista y el Toast. */
  onSubmit: (data: CreateUserRequest) => void;
}
