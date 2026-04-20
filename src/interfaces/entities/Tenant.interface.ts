export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  region_id: number;
  identification_type_id: number;
  identification: string;
  econ_activity: string;
  sign: string;
  contact_email: string;
  contact_phone?: string;
  is_subscribed: boolean;
  stripe_id: string | null;
  tax_regime: "traditional" | "simplified";
  created_at: string;
  updated_at: string;
}
