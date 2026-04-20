export interface NewTenantRequest {
  tenant_name: string;
  contact_email: string;
  contact_phone?: string;
  identification_type_id: number;
  identification: string;
  economic_activity: string;
  sign: string;
  region_id: number;
  is_subscribed?: boolean;
}
