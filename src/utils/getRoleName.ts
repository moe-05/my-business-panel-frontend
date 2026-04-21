import { capitalize } from "./capitalize";
import type { Role } from "@/interfaces/entities/Role.interface";

export const getRoleName = (roles: Role[], roleId: number): string =>
  capitalize(
    roles.find((r) => r.role_id === roleId)?.role_name || `Role ${roleId}`,
  );
