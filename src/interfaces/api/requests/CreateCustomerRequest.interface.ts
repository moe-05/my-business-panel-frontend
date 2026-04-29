export interface CreateCustomerRequest {
  tenant_id: string;
  first_name: string;
  last_name: string;
  identification_type: number;
  document_number: string;
  birthdate?: string;
  economic_activity?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: number;
}
