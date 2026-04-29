import type { TenantInfoResponse } from "../api/responses/TenantInfoResponse.interface";
import type { Role } from "./Role.interface";

export interface UserEmployee {
  employee_id: number;
  first_name: string;
  last_name: string;
  document_number: string;
  phone: string;
  employee_email: string;
  is_active: boolean;
  payment_schedule_id: number;
  branch_id: string;
  contract_id: number;
  start_date: string;
  end_date: string | null;
  hours: number;
  base_salary: number;
  duties: string;
  turn_type: number;
  turn_id: number | null;
}

export interface User {
  user_id: string;
  email: string;
  role_id: number;
  role?: Role;
  tenant_id: string;
  tenant?: TenantInfoResponse;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
  employee?: UserEmployee | null;
}
