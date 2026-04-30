export interface ContractData {
  start_date: string;
  end_date: string;
  hours: number;
  base_salary: number;
  duties: string;
  turn_type: number;
  turn_id: number;
}

export interface EmployeeInfo {
  tenant_id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  doc_number: string;
  identification_type_id: number;
  phone: string;
  email: string;
  payment_schedule_id: number;
  contractData: ContractData;
}

export interface CreateUserRequest {
  tenant_id: string;
  email: string;
  password: string;
  role_id: number;
  employeeInfo?: EmployeeInfo;
}
