import type { DocTypeCode } from "@/interfaces/entities/Customer.interface";

export interface CreateCustomerRequest {
  tenant_id: string;
  first_name: string;
  last_name: string;
  doc_type: DocTypeCode;
  doc_number: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: string;
}
