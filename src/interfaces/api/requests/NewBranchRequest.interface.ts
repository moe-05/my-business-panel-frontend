export interface NewBranchRequest {
  tenant_id: string;
  branch_name: string;
  branch_number: string;
  branch_address?: string;
  is_main_branch: boolean;
  territorio_code?: string;
  otras_senas?: string;
}
