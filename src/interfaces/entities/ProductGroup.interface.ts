export interface TenantProductGroupType {
  tenant_product_group_type_id: string;
  tenant_id: string;
  type_name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TenantProductGroup {
  tenant_product_group_id: string;
  tenant_id: string;
  tenant_product_group_type_id: string;
  parent_group_id: string | null;
  group_name: string;
  hierarchy_level: number;
  is_active: boolean;
  type_name?: string;
  path?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariantGroupAssignment {
  tenant_product_group_id: string;
  group_name: string;
  tenant_product_group_type_id: string;
  type_name: string;
  hierarchy_level: number;
}
