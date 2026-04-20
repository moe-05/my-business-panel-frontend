// ─── Session & User ───────────────────────────────────────────────────────────

export interface IUserSession {
  user_id: string;
  email: string;
  tenant_id: string;
  role_id: number;
}

export interface IRole {
  role_id: number;
  role_name: string;
  role_hierarchy: number;
}

export interface ITenantInfo {
  tenant_id: string;
  tenant_name: string;
  contact_email: string;
  is_subscribed: boolean;
  created_at: string;
}

export interface ICurrentUser {
  email: string;
  role: IRole;
  tenant: ITenantInfo;
}

// ─── Auth requests ────────────────────────────────────────────────────────────

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  message: string;
  user: IUserSession;
}

// ─── Tenant ───────────────────────────────────────────────────────────────────

export interface INewTenantRequest {
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

// ─── Onboarding (full tenant creation flow) ──────────────────────────────────

export interface IOnboardingBranch {
  branch_name?: string;
  branch_number?: string;
  branch_address?: string;
}

export interface IOnboardingUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  doc_number: string;
  phone: string;
}

export interface IOnboardingHacienda {
  hacienda_username: string;
  hacienda_password: string;
  hacienda_client_id: string;
  p12_base64: string;
  p12_password: string;
}

export interface IOnboardingSubscription {
  stripe_payment_method_id: string;
  plan: string;
  payment_method_id: number;
  payment_amount: number;
  subscription_type_id: number;
  start_date: string;
  end_date: string;
}

export interface IOnboardingRequest extends INewTenantRequest {
  branch?: IOnboardingBranch;
  user: IOnboardingUser;
  hacienda: IOnboardingHacienda;
  subscription: IOnboardingSubscription;
}

export interface IOnboardingResponse {
  tenant: ITenantResponse;
  branch: IBranchResponse;
  user: { user_id: string; email: string };
  subscription: {
    subscriptionId: string;
    clientSecret: string;
    invoice: string;
    status: string;
  };
}

export interface ITenantResponse {
  tenant_id: string;
  tenant_name: string;
  region_id: number;
  identification: string;
  econ_activity: string;
  sign: string;
  contact_email: string;
  is_subscribed: boolean;
  stripe_id: string | null;
  tax_regime: "traditional" | "simplified";
  created_at: string;
  updated_at: string;
}

// ─── Branch ───────────────────────────────────────────────────────────────────

export interface INewBranchRequest {
  tenant_id: string;
  branch_name: string;
  branch_number: string;
  branch_address?: string;
  is_main_branch: boolean;
}

export interface IBranchResponse {
  branch_id: string;
  branch_name: string;
  branch_number: string;
  branch_address: string;
  is_main_branch: boolean;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface IUpdateBranchRequest {
  branch_name?: string;
  branch_address?: string;
  is_main_branch?: boolean;
}

export interface IBranchListResponse {
  branches: IBranchResponse[];
  total: number;
  page: number;
  limit: number;
}

// ─── User (onboarding) ────────────────────────────────────────────────────────

export interface IContractData {
  start_date: string;
  end_date: string;
  hours: number;
  base_salary: number;
  duties: string;
  turn_type: number;
  turn_id: number;
}

export interface IEmployeeInfo {
  tenant_id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  doc_number: string;
  phone: string;
  email: string;
  payment_schedule_id: number;
  contractData: IContractData;
}

export interface ICreateUserRequest {
  tenant_id: string;
  email: string;
  password: string;
  role_id: number;
  employeeInfo: IEmployeeInfo;
}

export interface ICreateUserResponse {
  message: string;
  user_id: string;
  email: string;
}

// ─── User Management ──────────────────────────────────────────────────────────

export interface IUser {
  user_id: string;
  email: string;
  role_id: number;
  role?: IRole;
  tenant_id: string;
  tenant?: ITenantInfo;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface IUsersListResponse {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
}

export interface IUpdateUserRequest {
  email?: string;
  password?: string;
  role_id?: number;
}

export interface IUserDetailResponse extends IUser {
  role: IRole;
  tenant: ITenantInfo;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ICategory {
  category_id: string;
  category_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICategoriesResponse {
  categories: ICategory[];
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct {
  product_id: string;
  sku: string;
  product_name: string;
  description?: string;
  category_id: string;
  category?: ICategory;
  price: number;
  cabys_code?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface ICreateProductRequest {
  tenant_id: string;
  sku: string;
  product_name: string;
  description?: string;
  category_id: string;
  price: number;
  cabys_code?: string;
}

export interface IUpdateProductRequest {
  product_name?: string;
  description?: string;
  category_id?: string;
  price?: number;
  cabys_code?: string;
}

export interface IProductsListResponse {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
}

// ─── Segment ──────────────────────────────────────────────────────────────────

export interface ISegment {
  segment_id: string;
  segment_name: string;
  hierarchy?: number;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ISegmentsListResponse {
  segments: ISegment[];
  total?: number;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type DocumentType = "cedula" | "passport" | "dimex" | "nite" | "other";

export interface ICustomer {
  customer_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  doc_type: DocumentType;
  doc_number: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: string;
  segment?: ISegment;
  created_at: string;
  updated_at: string;
}

export interface ICreateCustomerRequest {
  tenant_id: string;
  first_name: string;
  last_name: string;
  doc_type: DocumentType;
  doc_number: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: string;
}

export interface IUpdateCustomerRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  segment_id?: string;
}

export interface ICustomersListResponse {
  customers: ICustomer[];
  total: number;
  page: number;
  limit: number;
}

// ─── Margin ───────────────────────────────────────────────────────────────────

export interface IMargin {
  margin_id: string;
  tenant_id: string;
  segment_id: string;
  segment?: ISegment;
  margin_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface ICreateMarginRequest {
  tenant_id: string;
  segment_id: string;
  margin_percentage: number;
}

export interface IMarginsListResponse {
  margins: IMargin[];
}

// ─── Document Type ────────────────────────────────────────────────────────────

export interface IDocumentType {
  doc_type_id: string;
  doc_type_name: string;
  abbreviation: string;
  description?: string;
}

export interface IDocumentTypesResponse {
  document_types: IDocumentType[];
}

// ─── Loyalty Program ──────────────────────────────────────────────────────────

export interface ILoyaltyProgram {
  loyalty_program_id: string;
  tenant_id: string;
  points_earned_per_currency_unit: number;
  points_redeemed_per_currency_unit: number;
  minimum_purchase_for_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ICreateLoyaltyProgramRequest {
  tenant_id: string;
  points_earned_per_currency_unit: number;
  points_redeemed_per_currency_unit: number;
  minimum_purchase_for_points?: number;
}

export interface IUpdateLoyaltyProgramRequest {
  minimum_purchase_for_points?: number;
}

// ─── Hacienda Config ──────────────────────────────────────────────────────────

export interface IHaciendaConfigStatus {
  configured: boolean;
  hacienda_username?: string;
  hacienda_client_id?: string;
  has_p12?: boolean;
}

export interface IHaciendaConfigUpdate {
  tenant_id: string;
  hacienda_username: string;
  hacienda_password: string;
  hacienda_client_id: string;
  p12_base64: string;
  p12_password: string;
}

// ─── Region ───────────────────────────────────────────────────────────────────

export interface IRegion {
  region_id: number;
  region_name: string;
  country_code: string;
  created_at: string;
  updated_at: string;
}

// ─── Onboarding state ─────────────────────────────────────────────────────────

export interface IOnboardingData {
  // Step 1 – cuenta personal
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  docNumber: string;
  // Step 2 – empresa
  tenantName: string;
  contactPhone: string;
  identificationType: number;
  identification: string;
  economicActivity: string;
  sign: string;
  regionId: number | null;
  branchName: string;
  branchNumber: string;
  branchAddress: string;
  // Step 3 – Hacienda
  haciendaUsername: string;
  haciendaPassword: string;
  haciendaClientId: string;
  p12Base64: string;
  p12Password: string;
  // Created IDs (after API calls)
  tenantId?: string | null;
  branchId?: string | null;
  userId: string | null;
}
