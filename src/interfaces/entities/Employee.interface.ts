export interface IEmployeeDetail {
  employee_id: string;
  contract_id: string;
  first_name: string;
  last_name: string;
  doc_number: string;
  phone: string;
  email: string;
  is_active: boolean;
  payment_schedule_id: number;
  branch_id: string;
  start_date: string;
  end_date: string;
  hours: number;
  base_salary: number;
  duties: string;
  turn_type: number;
  turn_id: number;
}

export interface UpdateEmployeePayload {
  first_name?: string;
  last_name?: string;
  doc_number?: string;
  identification_type_id?: number;
  phone?: string;
  email?: string;
  payment_schedule_id?: number;
  branch_id?: string;
}

export interface UpdateContractPayload {
  start_date: string;
  end_date: string;
  hours: number;
  base_salary: number;
  duties: string;
  turn_type: number;
  turn_id: number;
}
