export interface GlobalAttribute {
  global_attribute_id: string;
  attribute_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantAttribute {
  tenant_attribute_id: string;
  tenant_id: string;
  global_attribute_id: string | null;
  attribute_name: string;
  is_custom: boolean;
  global_attribute_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Unified row returned by GET /tenant-attribute/:tenantId/search.
 * Combines tenant_attribute + global_attribute (the ones not yet linked).
 */
export interface UnifiedAttribute {
  source: "TENANT" | "GLOBAL";
  id: string;
  global_attribute_id: string | null;
  name: string;
  is_custom: boolean;
}

export interface AttributeValue {
  attribute_value_id: string;
  tenant_id: string;
  tenant_attribute_id: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}
