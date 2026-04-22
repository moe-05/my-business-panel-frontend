import type { Segment } from "./Segment.interface";

export type DocTypeCode = number;

export interface Customer {
  customer_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  doc_type: number;
  doc_number: string;
  econ_activity?: string;
  birthdate?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: number;
  segment?: Segment;
  created_at: string;
  updated_at: string;
}
