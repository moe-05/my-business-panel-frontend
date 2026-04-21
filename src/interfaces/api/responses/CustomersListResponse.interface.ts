import type { Customer } from "@/interfaces/entities/Customer.interface";

export interface CustomersListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}
