import type { Segment } from "./Segment.interface";

export type DocTypeCode = "cedula" | "passport" | "dimex" | "nite" | "other";

export interface Customer {
  customer_id: string;
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
  segment?: Segment;
  created_at: string;
  updated_at: string;
}
