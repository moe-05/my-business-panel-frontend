export const url =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export { regionsApi } from "./regions.api";
export { authApi } from "./auth.api";
export { tenantApi } from "./tenant.api";
export { subscriptionApi } from "./subscription.api";
export { branchApi } from "./branch.api";
export { userApi } from "./user.api";
export { categoryApi } from "./category.api";
export { productApi } from "./product.api";
export { customerApi } from "./customer.api";
export { segmentApi } from "./segment.api";
export { marginApi } from "./margin.api";
export { documentApi } from "./document.api";
export { loyaltyApi } from "./loyalty.api";
export { haciendaApi } from "./hacienda.api";
